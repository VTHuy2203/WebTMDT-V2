import React from 'react';
import type { ProductSpecification } from '@marketplace/types';

export interface TechSpecsTableProps {
  specifications: ProductSpecification[];
  className?: string;
}

export const TechSpecsTable: React.FC<TechSpecsTableProps> = ({ specifications, className }) => {
  // Group specifications by group name
  const groups = specifications.reduce<Record<string, ProductSpecification[]>>((acc, spec) => {
    const groupName = spec.group || 'Thông số chung';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(spec);
    return acc;
  }, {});

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white ${className || ''}`}>
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Thông số kỹ thuật chi tiết</h4>
      </div>
      <div className="divide-y divide-slate-100">
        {Object.entries(groups).map(([groupName, specs]) => (
          <div key={groupName} className="p-4">
            <h5 className="font-semibold text-xs text-blue-600 uppercase mb-2 tracking-wide">{groupName}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {specs.map((spec) => (
                <div key={spec.key} className="flex justify-between py-1.5 border-b border-slate-50 text-sm">
                  <span className="text-slate-500 font-medium">{spec.label}</span>
                  <span className="text-slate-800 font-semibold text-right max-w-[60%]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
