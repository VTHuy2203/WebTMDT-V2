import { create } from 'zustand';
import { httpClient } from '@marketplace/api-client';
import { getAppConfig } from '@marketplace/config';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@marketplace/auth';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'shop';
  text: string;
  time: string;
  productCard?: { id?: string; name: string; price: number; image?: string };
}
export interface ChatShopInfo { id: string; name: string; logo?: string; isOfficial?: boolean; responseRate?: number }

interface ChatState {
  isOpen: boolean;
  activeShop: ChatShopInfo;
  messages: Record<string, ChatMessage[]>;
  isShopTyping: boolean;
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  productAttachment: { id?: string; name: string; price: number; image?: string } | null;
  openChatWithShop: (shop: ChatShopInfo, initialGreeting?: string, product?: any) => void;
  openAdminChat: (product?: any) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  sendQuickPrompt: (text: string) => void;
  clearProductAttachment: () => void;
  switchShop: (shop: ChatShopInfo) => void;
}

const ADMIN: ChatShopInfo = { id: 'admin', name: 'Admin Hỗ Trợ', isOfficial: true };
export const KNOWN_SHOPS: ChatShopInfo[] = [];
let socket: Socket | null = null;
let socketUserId: string | null = null;

class SilentSessionError extends Error {}

function authState() {
  return useAuthStore.getState();
}

function tokenSubject(token: string): string | null {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function clearInvalidPortalSession(set: any) {
  socket?.disconnect();
  socket = null;
  socketUserId = null;
  authState().logout();
  set({
    isOpen: false,
    isLoading: false,
    error: null,
    conversationId: null,
    messages: { admin: [] },
  });
}

function handleChatError(error: any, set: any) {
  const code = String(error?.code ?? '');
  const isInvalidPortalSession =
    error instanceof SilentSessionError ||
    code === 'BUYER_ACCOUNT_REQUIRED' ||
    code === 'ADMIN_REPLY_ENDPOINT_REQUIRED';

  if (isInvalidPortalSession) {
    clearInvalidPortalSession(set);
    return;
  }
  set({ isLoading: false, error: error?.message || 'Không gửi được tin nhắn' });
}

function mapMessage(message: any): ChatMessage {
  const state = authState();
  const createdAt = new Date(message.createdAt ?? Date.now());
  return {
    id: message.id,
    sender: message.senderRole
      ? (message.senderRole === 'ADMIN' ? 'shop' : 'user')
      : (message.senderId === state.user?.id ? 'user' : 'shop'),
    text: message.body ?? message.text ?? '',
    time: Number.isNaN(createdAt.getTime())
      ? ''
      : createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

async function ensureConversation(set: any, get: any) {
  const currentAuth = authState();
  const token = currentAuth.token;
  if (!token) throw new Error('Vui lòng đăng nhập để nhắn tin với Admin.');
  const subject = tokenSubject(token);
  if (
    (currentAuth.user?.id && subject && subject !== currentAuth.user.id) ||
    ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(currentAuth.user?.role ?? '')
  ) {
    clearInvalidPortalSession(set);
    throw new SilentSessionError('Invalid portal session');
  }
  if (socketUserId && socketUserId !== currentAuth.user?.id) {
    socket?.disconnect();
    socket = null;
    socketUserId = null;
    set({ conversationId: null, messages: { admin: [] } });
  }
  if (get().conversationId) return get().conversationId as string;
  set({ isLoading: true, error: null });
  const created = await httpClient.post('/conversations/admin-support');
  const conversation = created.data.data;
  const loaded = await httpClient.get(`/conversations/${conversation.id}/messages`);
  const messages = [...(loaded.data.data || [])].reverse().map(mapMessage);
  set((state: ChatState) => ({
    conversationId: conversation.id,
    messages: { ...state.messages, admin: messages },
    isLoading: false,
  }));
  if (!socket) {
    socket = io(`${new URL(getAppConfig().apiBaseUrl).origin}/chat`, { auth: { token }, transports: ['websocket'] });
    socketUserId = currentAuth.user?.id ?? null;
    socket.on('message.created', (raw) => {
      const message = mapMessage(raw);
      if (raw.conversationId !== get().conversationId) return;
      set((state: ChatState) => {
        const current = state.messages.admin || [];
        return current.some((item) => item.id === message.id)
          ? state
          : { messages: { ...state.messages, admin: [...current, message] } };
      });
    });
    socket.on('typing', (payload) => {
      if (payload.conversationId === get().conversationId) set({ isShopTyping: Boolean(payload.active) });
    });
  }
  socket.emit('conversation.join', { conversationId: conversation.id });
  return conversation.id as string;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeShop: ADMIN,
  messages: { admin: [] },
  isShopTyping: false,
  isLoading: false,
  error: null,
  conversationId: null,
  productAttachment: null,
  switchShop: (activeShop) => set({ activeShop }),
  openAdminChat: (product) => { set({ isOpen: true, activeShop: ADMIN, productAttachment: product || null }); void ensureConversation(set, get).catch((e) => handleChatError(e, set)); },
  openChatWithShop: (_shop, _greeting, product) => { set({ isOpen: true, activeShop: ADMIN, productAttachment: product || null }); void ensureConversation(set, get).catch((e) => handleChatError(e, set)); },
  toggleChat: () => {
    if (get().isOpen) set({ isOpen: false });
    else { set({ isOpen: true, activeShop: ADMIN }); void ensureConversation(set, get).catch((e) => handleChatError(e, set)); }
  },
  closeChat: () => set({ isOpen: false }),
  clearProductAttachment: () => set({ productAttachment: null }),
  sendMessage: async (text) => {
    if (!text.trim()) return;
    try {
      const conversationId = await ensureConversation(set, get);
      const response = await httpClient.post(`/conversations/${conversationId}/messages`, { text: text.trim() });
      const message = mapMessage(response.data.data);
      set((state) => {
        const current = state.messages.admin || [];
        return current.some((item) => item.id === message.id) ? state : {
          messages: { ...state.messages, admin: [...current, message] }, productAttachment: null, error: null,
        };
      });
    } catch (error: any) { handleChatError(error, set); }
  },
  sendQuickPrompt: (text) => { void get().sendMessage(text); },
}));
