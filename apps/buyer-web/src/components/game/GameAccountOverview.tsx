import React from 'react';
import type { GameAccountProduct } from '@marketplace/types';
import { GamePlatformBadge } from '@marketplace/ui';
import { Gamepad2, Server, Key, ShieldCheck, Link2 } from 'lucide-react';

export interface GameAccountOverviewProps {
  product: GameAccountProduct;
}

export const GameAccountOverview: React.FC<GameAccountOverviewProps> = ({ product }) => {
  const schema = product.game.attributeSchema || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Gamepad2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-bold text-slate-900">Thông Tin Chi Tiết Về Tài Khoản Game</h2>
      </div>

      {/* Core Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tựa Game</span>
          <div className="font-bold text-slate-900 text-sm">{product.game.name}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nền Tảng</span>
          <div>
            <GamePlatformBadge platform={product.platform} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Máy Chủ / Khu Vực</span>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>{product.server}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phương Thức Đăng Nhập</span>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>{product.loginMethod}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Game Attributes */}
      {schema.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chỉ Số & Thuộc Tính Nổi Bật</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {schema.map((attr) => {
              const val = product.publicAttributes[attr.key];
              if (val === undefined || val === null || val === '') return null;

              let formattedVal = String(val);
              if (attr.type === 'SELECT' && attr.options) {
                const opt = attr.options.find((o) => o.value === val);
                if (opt) formattedVal = opt.label;
              } else if (attr.type === 'BOOLEAN') {
                formattedVal = val ? 'Có' : 'Không';
              }

              return (
                <div key={attr.key} className="p-3 rounded-xl border border-slate-100 bg-blue-50/30 space-y-1">
                  <span className="text-[11px] text-slate-500">{attr.label}</span>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {formattedVal} {attr.unit ? <span className="text-xs font-normal text-slate-500">{attr.unit}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked Services */}
      {product.linkedServices && product.linkedServices.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Dịch vụ liên kết hiện tại: </span>
          <div className="flex flex-wrap gap-1.5">
            {product.linkedServices.map((srv, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800 text-[11px]">
                {srv}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
