import React, { useState } from 'react';
import type { AppDeliveryContent } from '@marketplace/types';
import { MaskedSecretField } from '@marketplace/ui';
import { CheckCircle2, Clock, Mail, Key, Users, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';

export interface AppDeliveryContentRendererProps {
  content: AppDeliveryContent;
  onConfirmReceived?: () => void;
  onReportIssue?: () => void;
  canConfirm?: boolean;
  canReport?: boolean;
}

export const AppDeliveryContentRenderer: React.FC<AppDeliveryContentRendererProps> = ({
  content,
  onConfirmReceived,
  onReportIssue,
  canConfirm = true,
  canReport = true,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const rawContent = content as any;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
      {/* 1. PRE_CREATED_ACCOUNT Delivery */}
      {rawContent.type === 'ACCOUNT_CREDENTIAL' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-900 bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-xl">
            <Key className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Thông tin tài khoản cấp sẵn</p>
              <p className="text-xs text-indigo-700">
                Tài khoản đã sẵn sàng. Bạn có thể sao chép thông tin và đăng nhập ngay.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MaskedSecretField label="Tài khoản / Email đăng nhập" value={rawContent.login || ''} />
            <MaskedSecretField label="Mật khẩu (Password)" value={rawContent.password || ''} />
            {rawContent.recoveryEmail && (
              <MaskedSecretField label="Email khôi phục" value={rawContent.recoveryEmail} />
            )}
            {rawContent.recoveryCode && (
              <MaskedSecretField label="Mã backup / Khôi phục" value={rawContent.recoveryCode} />
            )}
            {rawContent.twoFactorSecret && (
              <MaskedSecretField label="Mã bí mật 2FA" value={rawContent.twoFactorSecret} />
            )}
          </div>
        </div>
      )}

      {/* 2. BUYER_EMAIL_ACTIVATION Delivery */}
      {(rawContent.type === 'ACTIVATION_RESULT' || rawContent.fulfillmentType === 'BUYER_EMAIL_ACTIVATION') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-sm">Kích hoạt trực tiếp vào Email cá nhân</p>
              <p className="text-xs text-emerald-800">
                Email nhận gói:{' '}
                <strong className="underline">
                  {rawContent.targetEmailMasked || rawContent.targetEmail || 'Email bạn đã cung cấp'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Trạng thái: </span>
            <span className="text-emerald-700">
              {rawContent.activationStatus === 'ACTIVATED' || rawContent.type === 'ACTIVATION_RESULT'
                ? 'Đã kích hoạt thành công'
                : 'Người bán đã xử lý / gửi xác thực'}
            </span>
          </div>
        </div>
      )}

      {/* 3. FAMILY_OR_TEAM_INVITATION Delivery */}
      {(rawContent.type === 'INVITATION_RESULT' || rawContent.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 p-4 rounded-xl text-purple-900">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="font-bold text-sm">Lời mời nhóm Family / Team</p>
              <p className="text-xs text-purple-800">
                Lời mời gia nhập gói cước đã được gửi tới:{' '}
                <strong className="underline">
                  {rawContent.targetEmailMasked || rawContent.targetEmail || 'Email của bạn'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Trạng thái lời mời: </span>
            <span className="text-purple-700">
              {rawContent.invitationStatus === 'ACCEPTED'
                ? 'Đã chấp nhận lời mời'
                : 'Đã gửi lời mời qua email - Chờ bạn chấp nhận'}
            </span>
          </div>
        </div>
      )}

      {/* 4. LICENSE_KEY Delivery */}
      {rawContent.type === 'LICENSE_KEY' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900">
            <Key className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Mã bản quyền / License Key chính hãng</p>
              <p className="text-xs text-amber-800">
                Sao chép chuỗi mã bên dưới và nhập vào trang kích hoạt bản quyền của ứng dụng.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between gap-4 font-mono text-sm shadow-inner">
            <span className="truncate tracking-wider text-amber-300 font-bold">{rawContent.licenseKey}</span>
            <button
              onClick={() => handleCopy(rawContent.licenseKey)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-colors text-white"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          {rawContent.activationUrl && (
            <div className="text-xs">
              <a
                href={rawContent.activationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Mở trang kích hoạt bản quyền chính thức</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Instructions list */}
      {rawContent.instructions && rawContent.instructions.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hướng dẫn kích hoạt & sử dụng chi tiết</span>
          </p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-700 leading-relaxed border border-slate-100">
            {rawContent.instructions.map((step: string, idx: number) => (
              <p key={idx} className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 flex-shrink-0">•</span>
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {canReport && onReportIssue && (
          <button
            onClick={onReportIssue}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            Báo lỗi / Cần người bán hỗ trợ
          </button>
        )}

        {canConfirm && onConfirmReceived && (
          <button
            onClick={onConfirmReceived}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã kích hoạt thành công</span>
          </button>
        )}
      </div>
    </div>
  );
};
