import React, { useEffect, useState } from 'react';
import type { Product } from '@marketplace/types';
import { sellerApi } from '@marketplace/api-client';
import { Button, StatusBadge } from '@marketplace/ui';
import { Boxes, AlertTriangle, Check, RefreshCw } from 'lucide-react';

export const SellerInventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await sellerApi.getProducts();
      setProducts(data);
    }
    load();
  }, []);

  const handleStockChange = (variantId: string, value: number) => {
    setEditingStock((prev) => ({ ...prev, [variantId]: Math.max(0, value) }));
  };

  const handleSaveStock = async (variantId: string, currentStock: number) => {
    const newStock = editingStock[variantId] !== undefined ? editingStock[variantId] : currentStock;
    await sellerApi.updateStock(variantId, newStock);
    setSavedId(variantId);
    setTimeout(() => setSavedId(null), 2000);

    // Refresh products
    const updated = await sellerApi.getProducts();
    setProducts(updated);
  };

  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productName: p.name, productThumb: p.thumbnail }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Quản Lý Tồn Kho & SKU Thiết Bị</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cập nhật nhanh lượng hàng có sẵn theo từng SKU phiên bản phần cứng
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 min-w-[240px]">Sản Phẩm & Phiên Bản</th>
                <th className="p-4 min-w-[140px]">Mã SKU</th>
                <th className="p-4 min-w-[130px]">Trạng Thái Tồn</th>
                <th className="p-4 min-w-[140px]">Tồn Kho Khả Dụng</th>
                <th className="p-4 min-w-[120px] text-right">Lưu Tồn Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allVariants.map((v) => {
                const isLow = v.stock < 5 && v.stock > 0;
                const isOut = v.stock === 0;
                const currentVal = editingStock[v.id] !== undefined ? editingStock[v.id] : v.stock;

                return (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={v.image || v.productThumb} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{v.productName}</h4>
                        <span className="text-[11px] text-slate-500">{v.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">{v.sku}</td>
                    <td className="p-4">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          Hết hàng
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Sắp hết ({v.stock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Sẵn hàng ({v.stock})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 w-32">
                        <input
                          type="number"
                          min={0}
                          value={currentVal}
                          onChange={(e) => handleStockChange(v.id, Number(e.target.value))}
                          className="w-20 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-center"
                        />
                        <span className="text-slate-400 text-[11px]">máy</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant={savedId === v.id ? 'primary' : 'outline'}
                        onClick={() => handleSaveStock(v.id, v.stock)}
                        className={`text-xs ${savedId === v.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      >
                        {savedId === v.id ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Đã lưu
                          </>
                        ) : (
                          'Cập nhật'
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
