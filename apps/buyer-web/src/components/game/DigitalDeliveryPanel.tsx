import React, { useState, useEffect } from 'react';
import type { DigitalOrderListItem, RevealedGameAccountDelivery, DigitalDeliverySummary, DigitalIssueType } from '@marketplace/types';
import { digitalDeliveryApi } from '@marketplace/api-client';
import { MaskedSecretField, DigitalDeliveryBadge, Button, Modal } from '@marketplace/ui';
import { ReauthenticationDialog } from './ReauthenticationDialog';
import { ReportAccountIssueModal } from './ReportAccountIssueModal';
import {
  Lock,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export interface DigitalDeliveryPanelProps {
  order: DigitalOrderListItem;
  onOrderUpdated?: () => void;
}

export const DigitalDeliveryPanel: React.FC<DigitalDeliveryPanelProps> = ({ order, onOrderUpdated }) => {
  const [summary, setSummary] = useState<DigitalDeliverySummary | null>(null);
  const [revealedDelivery, setRevealedDelivery] = useState<RevealedGameAccountDelivery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copyAllFeedback, setCopyAllFeedback] = useState<Record<string, boolean>>({});

  // Fetch delivery summary when order changes
  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      try {
        const data = await digitalDeliveryApi.getDeliverySummary(order.id);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load delivery summary:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();

    // Clean up revealed secrets on unmount for security
    return () => {
      setRevealedDelivery(null);
    };
  }, [order.id]);

  const handleRevealClick = () => {
    if (summary?.requiresReauthentication) {
      setReauthOpen(true);
    } else {
      executeReveal();
    }
  };

  const executeReveal = async (password?: string) => {
    setIsRevealing(true);
    try {
      const data = await digitalDeliveryApi.revealDelivery(order.id, password);
      setRevealedDelivery(data);
      setReauthOpen(false);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      console.error('Failed to reveal credentials:', err);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleConfirmReceived = async () => {
    setIsConfirming(true);
    try {
      await digitalDeliveryApi.confirmReceived(order.id);
      setConfirmModalOpen(false);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      console.error('Error confirming order received:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReportIssue = async (data: {
    issueType: DigitalIssueType;
    description: string;
    evidenceImages: string[];
    desiredSolution: 'SUPPORT' | 'REPLACEMENT' | 'REFUND';
  }) => {
    try {
      await digitalDeliveryApi.reportIssue({
        orderId: order.id,
        issueType: data.issueType,
        description: data.description,
        evidenceImages: data.evidenceImages,
        desiredSolution: data.desiredSolution,
      });
      setReportModalOpen(false);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      console.error('Failed to submit issue report:', err);
    }
  };

  const handleCopyAllAccountInfo = async (accountIndex: number, cred: any) => {
    const text = [
      `--- TÀI KHOẢN GAME #${accountIndex + 1} ---`,
      `Tài khoản / Login: ${cred.login}`,
      `Mật khẩu: ${cred.password}`,
      cred.recoveryEmail ? `Email khôi phục: ${cred.recoveryEmail}` : '',
      cred.recoveryCode ? `Mã khôi phục: ${cred.recoveryCode}` : '',
      cred.twoFactorSecret ? `Secret 2FA: ${cred.twoFactorSecret}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyAllFeedback((prev) => ({ ...prev, [cred.inventoryItemId]: true }));
      setTimeout(() => {
        setCopyAllFeedback((prev) => ({ ...prev, [cred.inventoryItemId]: false }));
      }, 2500);
    } catch (err) {
      console.error('Failed to copy all account details', err);
    }
  };

  const effectiveDeliveryStatus = revealedDelivery ? 'REVEALED' : order.deliveryStatus;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Nội Dung Giao Hàng Số</span>
              <span className="text-xs font-normal text-slate-500">({order.quantity} tài khoản)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin bảo mật chỉ dành cho chủ sở hữu đơn hàng #{order.code}
            </p>
          </div>
        </div>

        <DigitalDeliveryBadge status={effectiveDeliveryStatus} />
      </div>

      {/* STATE 1: NOT_AVAILABLE */}
      {effectiveDeliveryStatus === 'NOT_AVAILABLE' && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">Nội dung giao hàng chưa khả dụng</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Đơn hàng chưa hoàn tất thanh toán. Vui lòng thanh toán qua mã QR 24/7 để hệ thống tự động mở thông tin đăng nhập tài khoản game.
          </p>
        </div>
      )}

      {/* STATE 2: PREPARING */}
      {effectiveDeliveryStatus === 'PREPARING' && (
        <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <h3 className="font-bold text-sm text-amber-900">Hệ thống đang chuẩn bị tài khoản của bạn</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Hệ thống đang kiểm tra bảo mật và phân bổ mã tài khoản vào đơn hàng của bạn. Quá trình này thường mất từ 15 đến 60 giây.
          </p>
        </div>
      )}

      {/* STATE 3: READY (Not yet revealed) */}
      {effectiveDeliveryStatus === 'READY' && !revealedDelivery && (
        <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-blue-900">
                Tài khoản game đã sẵn sàng bàn giao!
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Đơn hàng đã được gán <strong>{order.quantity} tài khoản game</strong> từ kho bảo đảm. Vì lý do bảo mật, thông tin mật khẩu được khóa mã hóa.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-blue-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Lưu ý bảo mật quan trọng:</span>
            </div>
            <p>• Tuyệt đối không chụp màn hình hoặc chia sẻ thông tin đăng nhập cho bất kỳ ai.</p>
            <p>• Bạn có thời gian bảo hành và khiếu nại trong vòng <strong>72 giờ</strong> sau khi mở thông tin.</p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleRevealClick}
              disabled={isRevealing}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Key className="w-4 h-4" />
              <span>{isRevealing ? 'Đang mở khóa bảo mật...' : 'Hiển Thị Thông Tin Tài Khoản Ngay'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* STATE 4: REVEALED */}
      {effectiveDeliveryStatus === 'REVEALED' && revealedDelivery && (
        <div className="space-y-6">
          {/* Instructions banner */}
          {revealedDelivery.instructions && revealedDelivery.instructions.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Hướng dẫn tiếp nhận và kiểm tra tài khoản:</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc text-[11px] leading-relaxed">
                {revealedDelivery.instructions.map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Credentials Cards for each purchased account */}
          <div className="space-y-4">
            {revealedDelivery.credentials.map((cred, idx) => (
              <div
                key={cred.inventoryItemId || idx}
                className="rounded-2xl border-2 border-blue-200 bg-white p-5 space-y-4 shadow-xs relative"
              >
                {/* Account Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">Thông Tin Tài Khoản Bàn Giao</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAllAccountInfo(idx, cred)}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      copyAllFeedback[cred.inventoryItemId]
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {copyAllFeedback[cred.inventoryItemId] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép toàn bộ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép toàn bộ mục #{idx + 1}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secret Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <MaskedSecretField
                    label="Tên đăng nhập / Email"
                    value={cred.login}
                    isSecret={false}
                    defaultMasked={false}
                  />

                  <MaskedSecretField
                    label="Mật khẩu"
                    value={cred.password}
                    isSecret={true}
                    defaultMasked={true}
                  />

                  {cred.recoveryEmail && (
                    <MaskedSecretField
                      label="Email khôi phục"
                      value={cred.recoveryEmail}
                      isSecret={true}
                      defaultMasked={true}
                    />
                  )}

                  {cred.recoveryCode && (
                    <MaskedSecretField
                      label="Mã khôi phục (Recovery Code)"
                      value={cred.recoveryCode}
                      isSecret={true}
                      defaultMasked={true}
                    />
                  )}

                  {cred.twoFactorSecret && (
                    <MaskedSecretField
                      label="Mã 2FA Secret"
                      value={cred.twoFactorSecret}
                      isSecret={true}
                      defaultMasked={true}
                    />
                  )}

                  {cred.additionalFields?.map((f, fIdx) => (
                    <MaskedSecretField
                      key={fIdx}
                      label={f.label}
                      value={f.value}
                      isSecret={false}
                      defaultMasked={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions & Completion */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bạn đã đăng nhập và kiểm tra tài khoản thành công?</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Nhấn xác nhận sau khi đã đổi thông tin bảo mật để hoàn tất đơn hàng và giải ngân cho người bán.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {order.allowedActions.reportIssue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tài khoản có vấn đề</span>
                </Button>
              )}

              {order.allowedActions.confirmReceived && (
                <Button
                  size="sm"
                  onClick={() => setConfirmModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tôi đã kiểm tra, tài khoản hoạt động</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 5: REPORTED */}
      {effectiveDeliveryStatus === 'REPORTED' && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Đơn hàng đang có yêu cầu khiếu nại hỗ trợ</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Hệ thống đang tạm giữ tiền thanh toán. Người bán đã nhận được thông báo và đang phản hồi xử lý đổi tài khoản hoặc hỗ trợ đăng nhập. Bạn có thể theo dõi tiến trình trong mục Yêu cầu hỗ trợ.
          </p>
        </div>
      )}

      {/* Reauthentication Modal */}
      <ReauthenticationDialog
        isOpen={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onConfirm={executeReveal}
        isLoading={isRevealing}
      />

      {/* Confirm Received Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác Nhận Đã Nhận & Hoàn Tất Đơn Hàng"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed">
            Bạn xác nhận rằng đã đăng nhập thành công vào tài khoản, kiểm tra đúng thông tin mô tả và đã tiến hành đổi mật khẩu bảo mật?
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            Sau khi xác nhận hoàn tất, đơn hàng sẽ chuyển sang trạng thái <strong>Hoàn thành</strong> và bảo hành theo chính sách đã cam kết của gian hàng.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              disabled={isConfirming}
            >
              Quay lại
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReceived}
              disabled={isConfirming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isConfirming ? 'Đang hoàn tất...' : 'Xác nhận tài khoản hoạt động'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <ReportAccountIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportIssue}
      />
    </div>
  );
};
