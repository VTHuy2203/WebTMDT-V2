import React, { useEffect, useState } from 'react';
import type { Product, Category, CategoryAttributeSchema } from '@marketplace/types';
import { sellerApi, adminApi, productApi } from '@marketplace/api-client';
import { Button, Input } from '@marketplace/ui';
import { ArrowLeft, Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export interface SellerProductFormViewProps {
  initialProduct?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SellerProductFormView: React.FC<SellerProductFormViewProps> = ({
  initialProduct,
  onSuccess,
  onCancel,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [schemas, setSchemas] = useState<CategoryAttributeSchema[]>([]);

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialProduct?.category.id || 'cat_laptop'
  );
  const [basePrice, setBasePrice] = useState(initialProduct?.basePrice || 35000000);
  const [thumbnail, setThumbnail] = useState(
    initialProduct?.thumbnail ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'
  );

  // Dynamic Specifications State
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Variants State
  const [variants, setVariants] = useState(
    initialProduct?.variants || [
      {
        id: 'var_1',
        sku: 'SKU-ROG-001',
        name: 'Phiên bản tiêu chuẩn (16GB RAM / 512GB SSD)',
        options: { ram: '16GB', storage: '512GB' },
        price: 35000000,
        stock: 10,
        availability: 'IN_STOCK' as const,
      },
    ]
  );

  // Warranty State
  const [warrantyMonths, setWarrantyMonths] = useState(initialProduct?.warranty?.durationMonths || 24);
  const [warrantyProvider, setWarrantyProvider] = useState(
    initialProduct?.warranty?.provider || 'Trung tâm bảo hành chính hãng'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Categories & Schemas
  useEffect(() => {
    async function loadMeta() {
      const [cats, scs] = await Promise.all([
        productApi.getCategories(),
        adminApi.getCategorySchemas(),
      ]);
      setCategories(cats);
      setSchemas(scs);

      // Populate existing specs if editing
      if (initialProduct?.specifications) {
        const initialMap: Record<string, string> = {};
        for (const s of initialProduct.specifications) {
          initialMap[s.key] = s.value;
        }
        setSpecs(initialMap);
      }
    }
    loadMeta();
  }, [initialProduct]);

  // Current active schema for the chosen category (Section 46 Dynamic Form)
  const currentSchema = schemas.find((s) => s.categoryId === selectedCategoryId);

  const handleSpecChange = (key: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var_${Date.now()}`,
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        name: 'Phiên bản mới',
        options: {},
        price: basePrice,
        stock: 5,
        availability: 'IN_STOCK',
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: string, val: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const categoryObj = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      // Format specs back to ProductSpecification array
      const formattedSpecs = Object.entries(specs).map(([key, val]) => {
        const fieldDef = currentSchema?.fields.find((f) => f.key === key);
        return {
          group: fieldDef?.group || 'Thông số',
          key,
          label: fieldDef?.label || key,
          value: val,
        };
      });

      await sellerApi.saveProduct({
        id: initialProduct?.id,
        name,
        description,
        basePrice,
        thumbnail,
        category: categoryObj,
        variants,
        specifications: formattedSpecs,
        warranty: {
          durationMonths: warrantyMonths,
          type: 'CHINH_HANH',
          provider: warrantyProvider,
          policy: `Bảo hành ${warrantyMonths} tháng chính hãng, kích hoạt qua Serial/IMEI.`,
          requiresSerial: true,
        },
      });

      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {initialProduct ? 'Lưu Thay Đổi' : 'Gửi Duyệt Sản Phẩm'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {initialProduct ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Đăng Bán Thiết Bị Điện Tử Mới'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sản phẩm đăng mới sẽ được gửi đến Ban Quản Trị để kiểm duyệt thông số trước khi hiển thị trên sàn.
          </p>
        </div>

        {/* 1. Thông tin chung */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            1. Thông Tin Cơ Bản
          </h3>

          <Input
            label="Tên sản phẩm điện tử"
            placeholder="Ví dụ: Laptop Gaming ASUS ROG Strix G16 (i7-14700HX / RTX 4060...)"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Danh Mục Sản Phẩm</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              label="Giá niêm yết cơ bản (VNĐ)"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
          </div>

          <Input
            label="URL Hình ảnh đại diện"
            placeholder="https://images.unsplash.com/photo-..."
            required
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mô tả sản phẩm</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả các tính năng nổi bật, tản nhiệt, công nghệ hiển thị..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* 2. Form Thông số Kỹ thuật Động theo Danh Mục (Section 46) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Thông Số Phần Cứng (Dynamic Tech Specs Schema)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Các trường thông số kỹ thuật được load động từ máy chủ theo danh mục được chọn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {currentSchema?.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' && field.options ? (
                  <select
                    value={specs[field.key] || ''}
                    onChange={(e) => handleSpecChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Chọn {field.label} --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={specs[field.key] || ''}
                    onChange={(e) => handleSpecChange(field.key, e.target.value)}
                    placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Biến thể sản phẩm (Variants & SKU) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              3. Cấu Hình & Biến Thể (SKU / Giá / Tồn Kho)
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={handleAddVariant}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Thêm biến thể
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                    placeholder="Tên phiên bản (VD: 16GB / 512GB)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                    placeholder="Mã SKU"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => handleUpdateVariant(idx, 'price', Number(e.target.value))}
                    placeholder="Giá bán"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                  />
                </div>
                <div className="w-full sm:w-24">
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                    placeholder="Tồn kho"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Cấu hình bảo hành Serial/IMEI */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              4. Cấu Hình Bảo Hành & Serial/IMEI
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Thời gian bảo hành (Tháng)
              </label>
              <select
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value={12}>12 Tháng</option>
                <option value={24}>24 Tháng (Khuyên dùng)</option>
                <option value={36}>36 Tháng</option>
              </select>
            </div>

            <Input
              label="Đơn vị / Trung tâm bảo hành"
              value={warrantyProvider}
              onChange={(e) => setWarrantyProvider(e.target.value)}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
