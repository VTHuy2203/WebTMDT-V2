import React, { useState, useEffect } from 'react';
import type {
  ApplicationSummary,
  ApplicationCategory,
  ApplicationPlatform,
  AppAccountFulfillmentType,
} from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Edit2,
  CheckCircle2,
  XCircle,
  Globe,
  Monitor,
  Apple,
  Smartphone,
  Terminal,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: { value: ApplicationCategory; label: string }[] = [
  { value: 'AI', label: 'Trợ lý AI & Mô hình ngôn ngữ' },
  { value: 'DESIGN', label: 'Thiết kế đồ họa & Video' },
  { value: 'OFFICE', label: 'Văn phòng & Công việc' },
  { value: 'ENTERTAINMENT', label: 'Giải trí & Phim/Nhạc' },
  { value: 'EDUCATION', label: 'Học tập & Giáo dục' },
  { value: 'DEV_TOOLS', label: 'Lập trình & Dev Tools' },
  { value: 'SECURITY', label: 'VPN & Bảo mật mạng' },
  { value: 'CLOUD_STORAGE', label: 'Lưu trữ đám mây Cloud' },
  { value: 'OTHER', label: 'Ứng dụng tiện ích khác' },
];

const PLATFORMS: { value: ApplicationPlatform; label: string }[] = [
  { value: 'WEB', label: 'Web' },
  { value: 'WINDOWS', label: 'Windows' },
  { value: 'MAC', label: 'macOS' },
  { value: 'ANDROID', label: 'Android' },
  { value: 'IOS', label: 'iOS' },
  { value: 'LINUX', label: 'Linux' },
];

export const AdminApplicationCatalogView: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationSummary | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<ApplicationCategory>('AI');
  const [formPublisher, setFormPublisher] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<ApplicationPlatform[]>(['WEB', 'WINDOWS', 'MAC']);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getApplicationCatalog();
      setApplications(list);
    } catch (err) {
      console.error('Failed to load application catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('AI');
    setFormPublisher('');
    setFormLogo('');
    setFormDescription('');
    setFormWebsite('');
    setFormPlatforms(['WEB', 'WINDOWS', 'MAC']);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (app: ApplicationSummary) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormSlug(app.slug);
    setFormCategory(app.category);
    setFormPublisher(app.publisher || '');
    setFormLogo(app.logo || app.logoUrl || '');
    setFormDescription(app.description || '');
    setFormWebsite(app.officialWebsiteUrl || '');
    setFormPlatforms(app.supportedPlatforms || ['WEB']);
    setFormError(null);
    setModalOpen(true);
  };

  const handleTogglePlatform = (p: ApplicationPlatform) => {
    setFormPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên ứng dụng.');
      return;
    }

    const generatedSlug =
      formSlug.trim() ||
      formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setSubmitting(true);
    try {
      const appPayload: ApplicationSummary = {
        id: editingApp?.id || 'app-' + Date.now(),
        name: formName.trim(),
        slug: generatedSlug,
        category: formCategory,
        publisher: formPublisher.trim() || undefined,
        logo: formLogo.trim() || undefined,
        logoUrl: formLogo.trim() || undefined,
        description: formDescription.trim() || undefined,
        officialWebsiteUrl: formWebsite.trim() || undefined,
        supportedPlatforms: formPlatforms,
        isActive: editingApp ? editingApp.isActive : true,
      };

      await adminApi.saveApplication(appPayload);
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu ứng dụng vào Catalog.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.publisher && app.publisher.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            <span>Danh Mục Ứng Dụng Chuẩn (Application Catalog)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý kho ứng dụng, danh mục và nền tảng hỗ trợ để người bán lựa chọn khi đăng bài.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ứng Dụng Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">Tất cả danh mục ứng dụng</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên app, publisher, slug..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Đang tải danh mục ứng dụng...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Chưa có ứng dụng nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={app.logo || app.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={app.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{app.name}</h3>
                      <p className="text-[11px] text-slate-500">{app.publisher || 'Nhà phát triển'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(app)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                    title="Chỉnh sửa ứng dụng"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                  {app.description || 'Ứng dụng bản quyền được tích hợp trên sàn TMĐT.'}
                </p>

                {/* Platforms & Category */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {app.category}
                  </span>

                  {(app.supportedPlatforms || []).map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  {app.activeListingsCount ?? 5}+ tin đang bán
                </span>

                {app.officialWebsiteUrl && (
                  <a
                    href={app.officialWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{editingApp ? 'Chỉnh Sửa Ứng Dụng' : 'Thêm Ứng Dụng Mới'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên ứng dụng *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: ChatGPT Plus"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã định danh (Slug)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="chatgpt-plus"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ApplicationCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhà phát triển / Publisher</label>
                  <input
                    type="text"
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    placeholder="VD: OpenAI, Google, Microsoft"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link Ảnh Logo / Icon (URL)</label>
                <input
                  type="url"
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website chính thức</label>
                <input
                  type="url"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="https://openai.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Nền tảng hỗ trợ</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => {
                    const checked = formPlatforms.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleTogglePlatform(p.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          checked
                            ? 'bg-purple-50 border-purple-300 text-purple-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {checked && '✓ '}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt tính năng của ứng dụng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-purple-400"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu ứng dụng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
