import React, { useEffect, useState, useRef } from 'react';
import type { AdminConversation, AdminMessageStatus } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';
import { getAppConfig } from '@marketplace/config';
import { io } from 'socket.io-client';
import { formatCurrency } from '@marketplace/utils';
import {
  Inbox,
  MessageCircle,
  Send,
  User,
  Headphones,
  ShieldCheck,
  Search,
  Filter,
  Archive,
  Eye,
  CheckCheck,
  Clock,
  Mail,
  MailOpen,
  ChevronRight,
  X,
  ArrowLeft,
  Sparkles,
  Bot,
  Pause,
  Play,
} from 'lucide-react';

type FilterTab = 'ALL' | 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';

export const AdminMessagesInboxView: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTogglingAutomation, setIsTogglingAutomation] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadConversations(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(`${new URL(getAppConfig().apiBaseUrl).origin}/chat`, {
      auth: { token }, transports: ['websocket'],
    });
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refreshInBackground = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void loadConversations(false), 100);
    };
    socket.on('message.created', refreshInBackground);
    socket.on('conversation.automation.changed', refreshInBackground);
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const frame = requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedConv?.id, selectedConv?.messages.length]);

  const loadConversations = async (showInitialLoading = false) => {
    if (showInitialLoading) setIsLoading(true);
    try {
      const data = await adminApi.getAdminConversations();
      setConversations(data);
      setSelectedConv((current) => current ? data.find((item) => item.id === current.id) ?? current : current);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showInitialLoading) setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectConversation = async (conv: AdminConversation) => {
    setSelectedConv(conv);
    if (conv.status === 'UNREAD') {
      await adminApi.updateConversationStatus(conv.id, 'READ');
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, status: 'READ' as AdminMessageStatus, unreadCount: 0 } : c))
      );
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setIsSending(true);
    try {
      await adminApi.replyAdminMessage(selectedConv.id, replyText.trim());
      // Refresh conversations
      const updated = await adminApi.getAdminConversations();
      setConversations(updated);
      const refreshedConv = updated.find((c) => c.id === selectedConv.id);
      if (refreshedConv) setSelectedConv(refreshedConv);
      setReplyText('');
      showToast('✓ Đã gửi phản hồi thành công!');
    } catch (err) {
      showToast('❌ Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const handleArchive = async (convId: string) => {
    await adminApi.updateConversationStatus(convId, 'ARCHIVED');
    const updated = await adminApi.getAdminConversations();
    setConversations(updated);
    if (selectedConv?.id === convId) {
      const refreshed = updated.find((c) => c.id === convId);
      if (refreshed) setSelectedConv(refreshed);
    }
    showToast('📦 Đã lưu trữ cuộc trò chuyện');
  };

  const handleAutomationToggle = async () => {
    if (!selectedConv || isTogglingAutomation) return;
    const enabled = selectedConv.automationEnabled === false;
    setIsTogglingAutomation(true);
    try {
      await adminApi.setConversationAutomation(selectedConv.id, enabled);
      const updated = await adminApi.getAdminConversations();
      setConversations(updated);
      const refreshed = updated.find((conversation) => conversation.id === selectedConv.id);
      if (refreshed) setSelectedConv(refreshed);
      showToast(enabled ? '✓ Đã bật bot tự động trả lời' : '✓ Đã dừng bot, Admin đang tiếp quản');
    } catch {
      showToast('❌ Không thể thay đổi chế độ trả lời');
    } finally {
      setIsTogglingAutomation(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterTab !== 'ALL' && c.status !== filterTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.userName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = conversations.filter((c) => c.status === 'UNREAD').length;

  const filterTabs: { id: FilterTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'ALL', label: 'Tất cả', icon: <Inbox className="w-3.5 h-3.5" />, count: conversations.length },
    { id: 'UNREAD', label: 'Chưa đọc', icon: <Mail className="w-3.5 h-3.5" />, count: unreadCount },
    { id: 'READ', label: 'Đã đọc', icon: <MailOpen className="w-3.5 h-3.5" /> },
    { id: 'REPLIED', label: 'Đã trả lời', icon: <CheckCheck className="w-3.5 h-3.5" /> },
    { id: 'ARCHIVED', label: 'Lưu trữ', icon: <Archive className="w-3.5 h-3.5" /> },
  ];

  const getStatusBadge = (status: AdminMessageStatus) => {
    switch (status) {
      case 'UNREAD':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
            Chưa đọc
          </span>
        );
      case 'READ':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
            Đã đọc
          </span>
        );
      case 'REPLIED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
            Đã trả lời
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full">
            Lưu trữ
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <Inbox className="w-5 h-5" />
            </div>
            Hòm Thư Người Dùng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tiếp nhận và phản hồi tin nhắn từ người mua hàng trên sàn
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <Mail className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-700">{unreadCount} tin nhắn mới</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl">
            <MessageCircle className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">{conversations.length} cuộc hội thoại</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, email, chủ đề..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Conversation List + Chat Detail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ minHeight: '600px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Đang tải hòm thư...</p>
            </div>
          </div>
        ) : (
          <div className="flex h-[600px]">
            {/* Left: Conversation List */}
            <div className={`w-full sm:w-96 border-r border-slate-200 flex flex-col ${selectedConv ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {filteredConversations.length} cuộc hội thoại
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Inbox className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Không có tin nhắn nào</p>
                    <p className="text-xs text-slate-400 mt-1">Tin nhắn từ người dùng sẽ xuất hiện ở đây</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-3.5 border-b border-slate-100 transition-all cursor-pointer hover:bg-slate-50 ${
                        selectedConv?.id === conv.id ? 'bg-purple-50 border-l-3 border-l-purple-500' : ''
                      } ${conv.status === 'UNREAD' ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {conv.userAvatar ? (
                            <img src={conv.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                              {conv.userName[0]}
                            </div>
                          )}
                          {conv.status === 'UNREAD' && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${conv.status === 'UNREAD' ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {conv.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                              {formatTimeAgo(conv.lastMessageAt)}
                            </span>
                          </div>

                          {conv.subject && (
                            <p className="text-[11px] font-bold text-purple-600 truncate mt-0.5">
                              {conv.subject}
                            </p>
                          )}

                          <p className={`text-xs truncate mt-0.5 ${conv.status === 'UNREAD' ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                            {conv.lastMessage}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5">
                            {getStatusBadge(conv.status)}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              conv.automationEnabled === false
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {conv.automationEnabled === false ? 'THỦ CÔNG' : 'AUTO'}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full min-w-[18px] text-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-2" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Chat Detail */}
            <div className={`flex-1 flex flex-col ${selectedConv ? 'flex' : 'hidden sm:flex'}`}>
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedConv(null)}
                        className="sm:hidden p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                      </button>

                      {selectedConv.userAvatar ? (
                        <img src={selectedConv.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {selectedConv.userName[0]}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{selectedConv.userName}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{selectedConv.userEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedConv.status)}
                      <button
                        type="button"
                        onClick={handleAutomationToggle}
                        disabled={isTogglingAutomation}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                          selectedConv.automationEnabled === false
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                        }`}
                        title={selectedConv.automationEnabled === false ? 'Bật lại bot tự động trả lời' : 'Dừng bot để Admin tiếp quản'}
                      >
                        {selectedConv.automationEnabled === false ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {selectedConv.automationEnabled === false ? 'Bật Auto' : 'Dừng Auto'}
                      </button>
                      {selectedConv.status !== 'ARCHIVED' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(selectedConv.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all cursor-pointer"
                          title="Lưu trữ"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  {selectedConv.subject && (
                    <div className="px-4 py-2 bg-purple-50/50 border-b border-purple-100">
                      <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Chủ đề: {selectedConv.subject}
                      </p>
                    </div>
                  )}

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 bg-slate-50/50"
                    style={{ overflowAnchor: 'none' }}
                  >
                    {selectedConv.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'user' && (
                          <div className="flex-shrink-0">
                            {selectedConv.userAvatar ? (
                              <img src={selectedConv.userAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {msg.senderName[0]}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`max-w-[75%] space-y-1 ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                          {/* Product Card Attachment */}
                          {msg.productCard && (
                            <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs max-w-[250px]">
                              {msg.productCard.image && (
                                <img src={msg.productCard.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-900 truncate">{msg.productCard.name}</p>
                                <p className="text-[11px] font-extrabold text-red-600">{formatCurrency(msg.productCard.price)}</p>
                              </div>
                            </div>
                          )}

                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                              msg.sender === 'admin'
                                ? 'bg-purple-600 text-white rounded-br-sm'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <p className="text-[10px] text-slate-400 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {formatTimeAgo(msg.createdAt)}
                          </p>
                        </div>

                        {msg.sender === 'admin' && (
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                              <Headphones className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick Replies */}
                  <div className={`px-4 py-2 border-t text-[11px] font-semibold flex items-center gap-2 ${
                    selectedConv.automationEnabled === false
                      ? 'bg-amber-50 border-amber-100 text-amber-700'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}>
                    <Bot className="w-4 h-4" />
                    {selectedConv.automationEnabled === false
                      ? 'Bot đang dừng — Admin trực tiếp phụ trách hộp thư này.'
                      : 'Bot đang tự động trả lời — gửi phản hồi trực tiếp sẽ tự dừng bot.'}
                  </div>
                  <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {[
                      'Dạ Admin đã nhận thông tin, sẽ xử lý ngay ạ!',
                      'Bạn vui lòng cung cấp mã đơn hàng nhé!',
                      'Đã chuyển vấn đề cho bộ phận hỗ trợ.',
                      'Cảm ơn bạn đã liên hệ!',
                    ].map((quickReply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(quickReply)}
                        className="text-[10px] font-medium bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition-colors cursor-pointer shrink-0"
                      >
                        {quickReply}
                      </button>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                      placeholder="Nhập phản hồi cho người dùng..."
                      className="flex-1 text-sm px-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 border border-transparent focus:border-purple-400 transition-all text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={!replyText.trim() || isSending}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 text-sm font-semibold flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Gửi</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto">
                      <MessageCircle className="w-9 h-9 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-700">Chọn cuộc hội thoại</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Chọn một cuộc trò chuyện từ danh sách bên trái để xem và phản hồi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
