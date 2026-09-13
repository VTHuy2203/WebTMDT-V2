import React, { useEffect, useState } from 'react';
import type { GameSummary, GamePlatform, GameAttributeDefinition } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { GamePlatformBadge } from '@marketplace/ui';
import {
  Layers,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle2,
  Gamepad2,
  Sliders,
  Trash2,
} from 'lucide-react';

export const AdminGameCatalogView: React.FC = () => {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Add modal
  const [editingGame, setEditingGame] = useState<Partial<GameSummary> | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getGameCatalog();
      setGames(list);
    } catch (err) {
      console.error('Failed to load game catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleOpenAdd = () => {
    setEditingGame({
      id: `game_${Date.now()}`,
      name: '',
      slug: '',
      publisher: '',
      icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      supportedPlatforms: ['PC'],
      supportedServers: ['Việt Nam', 'Châu Á'],
      attributeSchema: [],
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (game: GameSummary) => {
    setEditingGame({ ...game, attributeSchema: [...(game.attributeSchema || [])] });
    setEditModalOpen(true);
  };

  const handleAddAttribute = () => {
    if (!editingGame) return;
    const newAttr: GameAttributeDefinition = {
      key: `attr_${Date.now()}`,
      label: 'Thuộc tính mới',
      type: 'TEXT',
      required: false,
      isFilterable: true,
      isPublic: true,
    };
    setEditingGame({
      ...editingGame,
      attributeSchema: [...(editingGame.attributeSchema || []), newAttr],
    });
  };

  const handleUpdateAttribute = (index: number, patch: Partial<GameAttributeDefinition>) => {
    if (!editingGame || !editingGame.attributeSchema) return;
    const nextSchema = [...editingGame.attributeSchema];
    nextSchema[index] = { ...nextSchema[index], ...patch };
    setEditingGame({ ...editingGame, attributeSchema: nextSchema });
  };

  const handleRemoveAttribute = (index: number) => {
    if (!editingGame || !editingGame.attributeSchema) return;
    setEditingGame({
      ...editingGame,
      attributeSchema: editingGame.attributeSchema.filter((_, idx) => idx !== index),
    });
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editingGame.name || !editingGame.slug) {
      alert('Vui lòng điền tên game và slug định danh.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.saveGame(editingGame as GameSummary);
      setEditModalOpen(false);
      setEditingGame(null);
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu tựa game.');
    } finally {
      setSaving(false);
    }
  };

  const filteredGames = games.filter(
    (g) =>
      searchQuery === '' ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.publisher || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-purple-600" />
            Danh Mục Game & Schema Thuộc Tính Động
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình các tựa game được hỗ trợ, nền tảng hệ máy, server và các trường thuộc tính khi người bán đăng bài
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm tựa game mới
          </button>
          <button
            onClick={loadCatalog}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trò chơi, nhà phát hành..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Games List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            Đang tải danh mục tựa game...
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Chưa có tựa game nào trong danh mục.
          </div>
        ) : (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative h-28 w-full bg-slate-900">
                  <img
                    src={game.coverImage || game.icon}
                    alt={game.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <img
                      src={game.icon}
                      alt={game.name}
                      className="w-12 h-12 rounded-xl border-2 border-white object-cover bg-white shadow"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight drop-shadow">
                        {game.name}
                      </h3>
                      <span className="text-xs text-purple-200">{game.publisher}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Nền tảng hỗ trợ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(game.supportedPlatforms || game.platforms || []).map((plat) => (
                        <GamePlatformBadge key={plat} platform={plat} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Máy chủ (Servers):</span>
                    <p className="text-xs text-slate-600 truncate">{(game.supportedServers || game.servers || []).join(', ')}</p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Schema thuộc tính ({game.attributeSchema?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {game.attributeSchema && game.attributeSchema.length > 0 ? (
                        game.attributeSchema.map((attr) => (
                          <span
                            key={attr.key}
                            className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 rounded"
                          >
                            {attr.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Mặc định</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">slug: {game.slug}</span>
                <button
                  onClick={() => handleOpenEdit(game)}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Cấu hình
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT / ADD MODAL */}
      {editModalOpen && editingGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              {editingGame.id ? 'Cấu hình tựa game' : 'Thêm tựa game mới'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Thiết lập thông tin hiển thị và các trường thông số bắt buộc cho người bán
            </p>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên trò chơi *</label>
                  <input
                    type="text"
                    value={editingGame.name || ''}
                    onChange={(e) =>
                      setEditingGame({
                        ...editingGame,
                        name: e.target.value,
                        slug: editingGame.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    placeholder="Ví dụ: Liên Quân Mobile"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đường dẫn tĩnh (Slug) *</label>
                  <input
                    type="text"
                    value={editingGame.slug || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, slug: e.target.value })}
                    placeholder="lien-quan-mobile"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhà phát hành *</label>
                  <input
                    type="text"
                    value={editingGame.publisher || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, publisher: e.target.value })}
                    placeholder="Garena / Riot Games / Mihoyo..."
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon URL</label>
                  <input
                    type="text"
                    value={editingGame.icon || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, icon: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Danh sách Server (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editingGame.supportedServers?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingGame({
                      ...editingGame,
                      supportedServers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Việt Nam, Châu Á, Bắc Mỹ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Dynamic Attribute Schema Builder */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Schema thuộc tính động</h4>
                    <p className="text-xs text-slate-500">Các trường riêng cho tựa game này (VD: Bậc ngọc, Tướng hiếm...)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm trường
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editingGame.attributeSchema?.map((attr, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={attr.label}
                        onChange={(e) => handleUpdateAttribute(idx, { label: e.target.value })}
                        placeholder="Tên nhãn (Hiển thị)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => handleUpdateAttribute(idx, { key: e.target.value })}
                        placeholder="Mã key (vd: rankTier)"
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                      <select
                        value={attr.type}
                        onChange={(e) => handleUpdateAttribute(idx, { type: e.target.value as any })}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="TEXT">Văn bản</option>
                        <option value="NUMBER">Số</option>
                        <option value="BOOLEAN">Có / Không</option>
                        <option value="SELECT">Chọn từ mục</option>
                      </select>
                      <label className="flex items-center gap-1 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={attr.required}
                          onChange={(e) => handleUpdateAttribute(idx, { required: e.target.checked })}
                          className="rounded text-purple-600"
                        />
                        Bắt buộc
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu tựa game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
