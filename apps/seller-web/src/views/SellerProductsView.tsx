import React, { useEffect, useState } from 'react';
import type { Product } from '@marketplace/types';
import { sellerApi } from '@marketplace/api-client';
import { StatusBadge, Button, EmptyState } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import { PlusCircle, Search, Edit3, Eye, MoreHorizontal } from 'lucide-react';

export interface SellerProductsViewProps {
  onAddNew: () => void;
  onEditProduct: (product: Product) => void;
}

export const SellerProductsView: React.FC<SellerProductsViewProps> = ({ onAddNew, onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await sellerApi.getProducts();
        setProducts(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản Lý Sản Phẩm</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách thiết bị điện tử, trạng thái kiểm duyệt và giá bán
          </p>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4" />
          <span>Thêm Thiết Bị Mới</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên máy, mã sản phẩm..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['ALL', 'ACTIVE', 'PENDING_REVIEW', 'DRAFT', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL'
                ? 'Tất cả'
                : st === 'ACTIVE'
                ? 'Đang bán'
                : st === 'PENDING_REVIEW'
                ? 'Chờ duyệt'
                : st === 'DRAFT'
                ? 'Bản nháp'
                : 'Bị từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 min-w-[240px]">Sản Phẩm & Cấu Hình</th>
                <th className="p-4 min-w-[130px]">Danh Mục</th>
                <th className="p-4 min-w-[140px]">Giá Bán</th>
                <th className="p-4 min-w-[120px]">Số Lượng Kho</th>
                <th className="p-4 min-w-[110px]">Trạng Thái</th>
                <th className="p-4 min-w-[110px] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={prod.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{prod.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {prod.variants.length} biến thể • Đã bán {prod.soldCount}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{prod.category.name}</td>
                    <td className="p-4 font-bold text-slate-900">{formatCurrency(prod.basePrice)}</td>
                    <td className="p-4">
                      <span className={`font-semibold ${totalStock < 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {totalStock} máy
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={prod.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditProduct(prod)}
                        className="text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Chỉnh sửa
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
