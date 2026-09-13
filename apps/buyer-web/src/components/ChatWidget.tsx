import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { formatCurrency } from '@marketplace/utils';
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  Sparkles,
  Package,
  Zap,
  HelpCircle,
  Store,
  Maximize2,
  Minimize2,
  User,
  Headphones,
} from 'lucide-react';

export const ChatWidget: React.FC = () => {
  const {
    isOpen,
    messages,
    isShopTyping,
    isLoading,
    error,
    productAttachment,
    toggleChat,
    closeChat,
    sendMessage,
    sendQuickPrompt,
    clearProductAttachment,
  } = useChatStore();

  const [inputVal, setInputVal] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminMessages = messages['admin'] || [];
  const visibleError = error &&
    !error.includes('Tài khoản quản trị') &&
    !error.includes('Tài khoản Admin') &&
    !error.includes('BUYER_ACCOUNT_REQUIRED')
    ? error
    : null;

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminMessages, isShopTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className={isMaximized && isOpen ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs' : 'fixed bottom-6 right-6 z-50'}>
      {/* Floating Trigger & Direct Social Support Cluster — VERTICAL LAYOUT */}
      {!isOpen && (
        <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          {/* Telegram Button */}
          <a
            href="https://t.me/mind_flux_0"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-2.5 bg-[#229ED9] hover:bg-[#1e8ec3] text-white rounded-full shadow-lg shadow-sky-500/25 transition-all hover:scale-105 cursor-pointer border border-white/20"
            title="Chat Telegram: @mind_flux_0"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
              </svg>
            </div>
            <div className="text-left pr-1">
              <span className="text-[11px] font-bold block leading-tight">Telegram</span>
              <span className="text-[9px] text-sky-100 block leading-tight font-mono">@mind_flux_0</span>
            </div>
          </a>

          {/* Zalo Button */}
          <a
            href="https://zalo.me/0325324064"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-2.5 bg-[#0068FF] hover:bg-[#0058db] text-white rounded-full shadow-lg shadow-blue-600/25 transition-all hover:scale-105 cursor-pointer border border-white/20"
            title="Chat Zalo: +84 325 324 064"
          >
            <div className="w-6 h-6 rounded-full bg-white text-[#0068FF] font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs font-sans">
              Zalo
            </div>
            <div className="text-left pr-1">
              <span className="text-[11px] font-bold block leading-tight">Zalo Chat</span>
              <span className="text-[9px] text-blue-100 block leading-tight font-mono">+84 325 324 064</span>
            </div>
          </a>

          {/* Direct Admin Chat Trigger */}
          <button
            type="button"
            onClick={toggleChat}
            className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-full shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 cursor-pointer border border-white/20"
          >
            <div className="relative">
              <Headphones className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-purple-600 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block leading-tight">Nhắn tin với Admin</span>
              <span className="text-[10px] text-purple-200 block leading-tight">Hỗ trợ trực tuyến 24/7</span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in ${
          isMaximized ? 'w-full max-w-4xl h-[90vh]' : 'w-[340px] sm:w-[420px] h-[550px]'
        }`}>
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border border-white/20 shadow-xs">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-purple-900 rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs truncate max-w-[200px] text-white">
                    Admin Hỗ Trợ
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Đang online
                  </span>
                  <span>•</span>
                  <span>Phản hồi: ~5 phút</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title={isMaximized ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={closeChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Direct Channels Bar: Zalo & Tele */}
          <div className="px-3.5 py-1.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Hỗ trợ 1:1 qua App:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <a
                href="https://zalo.me/0325324064"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0068FF] text-white text-[11px] font-bold hover:bg-[#0058db] transition-colors shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Zalo: +84 325 324 064</span>
              </a>
              <a
                href="https://t.me/mind_flux_0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#229ED9] text-white text-[11px] font-bold hover:bg-[#1e8ec3] transition-colors shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Tele: @mind_flux_0</span>
              </a>
            </div>
          </div>

          {/* Product Attachment Preview Bar (if inquiring about an item) */}
          {productAttachment && (
            <div className="bg-purple-50/90 border-b border-purple-100 p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {productAttachment.image && (
                  <img
                    src={productAttachment.image}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover border border-purple-200 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-purple-900 truncate">
                    {productAttachment.name}
                  </p>
                  <p className="text-[10px] font-extrabold text-red-600">
                    {formatCurrency(productAttachment.price)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearProductAttachment}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {isLoading && <p className="text-center text-slate-500">Đang kết nối với Admin...</p>}
            {visibleError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{visibleError}</p>}
            {!isLoading && !visibleError && adminMessages.length === 0 && (
              <p className="text-center text-slate-500">Hãy gửi tin nhắn để bắt đầu trao đổi với Admin.</p>
            )}
            {adminMessages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Embedded Product Card in message */}
                {m.productCard && (
                  <div className="mb-1 p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 max-w-[85%] shadow-xs">
                    {m.productCard.image && (
                      <img src={m.productCard.image} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-900 truncate">{m.productCard.name}</p>
                      <p className="text-[10px] text-red-600 font-bold">{formatCurrency(m.productCard.price)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-1.5">
                  {m.sender === 'shop' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 mb-0.5">
                      <Headphones className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] p-3 rounded-2xl leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 mb-0.5">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {/* Admin Typing Indicator */}
            {isShopTyping && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200/80 max-w-[65%] text-[11px] text-slate-500 shadow-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                <span>Admin đang trả lời...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiry Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              'Tôi cần hỗ trợ đơn hàng',
              'Hướng dẫn thanh toán',
              'Khiếu nại sản phẩm',
              'Câu hỏi về bảo hành',
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuickPrompt(prompt)}
                className="text-[10px] font-medium bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhắn tin cho Admin hỗ trợ..."
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 border border-transparent focus:border-purple-400 transition-all text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
