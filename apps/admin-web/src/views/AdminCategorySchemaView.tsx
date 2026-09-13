import React, { useEffect, useState } from 'react';
import type { CategoryAttributeSchema } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { Button } from '@marketplace/ui';
import { Layers, Plus, Check } from 'lucide-react';

export const AdminCategorySchemaView: React.FC = () => {
  const [schemas, setSchemas] = useState<CategoryAttributeSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<CategoryAttributeSchema | null>(null);

  useEffect(() => {
    async function load() {
      const data = await adminApi.getCategorySchemas();
      setSchemas(data);
      if (data.length > 0) setSelectedSchema(data[0]);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Quản Lý Schema Thông Số Kỹ Thuật Theo Danh Mục
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy định các trường thông số bắt buộc và danh sách tùy chọn (CPU, RAM, GPU, Màn hình...)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Category List (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 space-y-2">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider px-2 py-1">
            Danh Mục Đã Có Schema
          </h3>
          <div className="space-y-1">
            {schemas.map((s) => (
              <button
                key={s.categoryId}
                onClick={() => setSelectedSchema(s)}
                className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-colors ${
                  selectedSchema?.categoryId === s.categoryId
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {s.categoryName}
              </button>
            ))}
          </div>
        </div>

        {/* Schema Fields Editor (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          {selectedSchema ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Cấu Hình Trường Kỹ Thuật: {selectedSchema.categoryName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Người bán sẽ điền các thông số này khi đăng sản phẩm thuộc danh mục này
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {selectedSchema.fields.map((field) => (
                  <div key={field.key} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{field.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">({field.key})</span>
                        {field.required && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-600 font-semibold">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px] block mt-0.5">Nhóm: {field.group}</span>
                      {field.options && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {field.options.map((opt) => (
                            <span
                              key={opt}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[10px] text-slate-600 uppercase">
                      {field.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">Chọn danh mục để xem schema</div>
          )}
        </div>
      </div>
    </div>
  );
};
