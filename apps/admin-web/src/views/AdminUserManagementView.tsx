import React, { useEffect, useState, useMemo } from 'react';
import type { AdminManagedUser, UserStatus, UserRole, UserSupportNote } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { formatCurrency } from '@marketplace/utils';
import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Ban,
  Unlock,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingBag,
  PlusCircle,
  Copy,
  Check,
  Headphones,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Calendar,
  Phone,
  Mail,
  X,
  Send,
  EyeOff,
  Key,
  Lock,
} from 'lucide-react';

export const AdminUserManagementView: React.FC = () => {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Modals & Drawers state
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'orders' | 'notes'>('overview');
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Edit user modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<AdminManagedUser>>({});
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showDrawerPassword, setShowDrawerPassword] = useState(false);

  // Ban modal
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banReasonPreset, setBanReasonPreset] = useState('Lừa đảo chiếm đoạt tài khoản game / tài khoản ứng dụng');
  const [banReasonDetail, setBanReasonDetail] = useState('');
  const [userToBan, setUserToBan] = useState<AdminManagedUser | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminManagedUser | null>(null);

  // Adjust balance modal
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAdjustType, setBalanceAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [balanceAmount, setBalanceAmount] = useState<number>(50000);
  const [balanceReason, setBalanceReason] = useState('Bồi thường sự cố bàn giao mã đơn hàng chậm');

  // New support note inside drawer
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Toast / feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
      if (selectedUser) {
        const updatedSelected = data.find((u) => u.id === selectedUser.id);
        if (updatedSelected) setSelectedUser(updatedSelected);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = user.fullName.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phoneNumber?.includes(q);
        const matchId = user.id.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      // Role filter
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const banned = users.filter((u) => u.status === 'BANNED').length;
    const totalWalletBalance = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    return { total, active, banned, totalWalletBalance };
  }, [users]);

  // Open User Detail Drawer
  const handleOpenDetail = (user: AdminManagedUser, initialTab: 'overview' | 'orders' | 'notes' = 'overview') => {
    setSelectedUser(user);
    setDrawerTab(initialTab);
    setIsDetailDrawerOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminManagedUser) => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      password: user.password || 'TechMarket@123',
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      identityVerified: user.identityVerified,
      walletBalance: user.walletBalance,
    });
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  // Generate random password
  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newPass = `Tech@${randomPart}`;
    setEditFormData((prev) => ({ ...prev, password: newPass }));
    setShowEditPassword(true);
    showToast(`Đã tạo mật khẩu mới: ${newPass}`);
  };

  // Save Edit User
  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const updated = await adminApi.updateUser(selectedUser.id, editFormData);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSelectedUser(updated);
      setIsEditModalOpen(false);
      showToast(`Đã cập nhật thông tin người dùng ${updated.fullName} thành công!`);
    } catch (err) {
      alert('Không thể lưu thông tin người dùng: ' + (err as Error).message);
    }
  };

  // Open Ban Modal
  const handleOpenBan = (user: AdminManagedUser) => {
    setUserToBan(user);
    setBanReasonPreset('Lừa đảo chiếm đoạt tài khoản game / tài khoản ứng dụng');
    setBanReasonDetail('');
    setIsBanModalOpen(true);
  };

  // Confirm Ban Permanently
  const handleConfirmBan = async () => {
    if (!userToBan) return;
    const finalReason = banReasonDetail.trim()
      ? `${banReasonPreset} — Chi tiết: ${banReasonDetail.trim()}`
      : banReasonPreset;
    try {
      await adminApi.banUserPermanently(userToBan.id, finalReason);
      await loadUsers();
      setIsBanModalOpen(false);
      setUserToBan(null);
      showToast(`Đã khóa vĩnh viễn tài khoản ${userToBan.fullName}!`);
    } catch (err) {
      alert('Không thể khóa tài khoản: ' + (err as Error).message);
    }
  };

  // Confirm Unban
  const handleUnban = async (user: AdminManagedUser) => {
    if (!confirm(`Bạn có chắc chắn muốn mở khóa tài khoản cho "${user.fullName}"?`)) return;
    try {
      await adminApi.unbanUser(user.id);
      await loadUsers();
      showToast(`Đã mở khóa tài khoản cho ${user.fullName}!`);
    } catch (err) {
      alert('Không thể mở khóa tài khoản: ' + (err as Error).message);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (user: AdminManagedUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) {
        setIsDetailDrawerOpen(false);
        setSelectedUser(null);
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      showToast(`Đã xóa tài khoản thành công.`);
    } catch (err) {
      alert('Không thể xóa tài khoản: ' + (err as Error).message);
    }
  };

  // Open Balance Adjust Modal
  const handleOpenBalanceModal = (user: AdminManagedUser) => {
    setSelectedUser(user);
    setBalanceAmount(50000);
    setBalanceReason('Bồi thường sự cố giao dịch / Hỗ trợ khách hàng');
    setIsBalanceModalOpen(true);
  };

  // Confirm Balance Adjustment
  const handleConfirmBalanceAdjust = async () => {
    if (!selectedUser || balanceAmount <= 0) return;
    const amountToApply = balanceAdjustType === 'ADD' ? balanceAmount : -balanceAmount;
    try {
      await adminApi.adjustUserBalance(selectedUser.id, amountToApply, balanceReason);
      await loadUsers();
      setIsBalanceModalOpen(false);
      showToast(
        `Đã ${balanceAdjustType === 'ADD' ? 'cộng' : 'trừ'} ${formatCurrency(
          balanceAmount
        )} vào ví của ${selectedUser.fullName}!`
      );
    } catch (err) {
      alert('Không thể điều chỉnh số dư: ' + (err as Error).message);
    }
  };

  // Submit Support Note in Drawer
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newNoteText.trim()) return;
    try {
      setIsSubmittingNote(true);
      const note = await adminApi.addUserSupportNote(selectedUser.id, newNoteText.trim(), 'Admin Quản Trị');
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              adminNotes: [note, ...(prev.adminNotes || [])],
            }
          : null
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, adminNotes: [note, ...(u.adminNotes || [])] }
            : u
        )
      );
      setNewNoteText('');
      showToast('Đã lưu ghi chú hỗ trợ nội bộ!');
    } catch (err) {
      alert('Lỗi lưu ghi chú: ' + (err as Error).message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đang hoạt động
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Tạm khóa
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Khóa vĩnh viễn
          </span>
        );
      case 'DELETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            Đã xóa
          </span>
        );
      default:
        return null;
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Quản trị viên
          </span>
        );
      case 'SELLER_OWNER':
      case 'SELLER_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Store className="w-3 h-3 text-indigo-600" />
            Chủ Gian Hàng
          </span>
        );
      case 'BUYER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Người mua hàng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Người Dùng & Trung Tâm Hỗ Trợ
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Tra cứu thông tin, lịch sử đơn hàng, hỗ trợ trực tiếp, chỉnh sửa và chế tài khóa tài khoản
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-purple-600 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Tổng người dùng</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Đang hoạt động</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Bị khóa vĩnh viễn</span>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5">{stats.banned}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Tổng số dư ví</span>
            <h3 className="text-xl font-bold text-indigo-600 mt-0.5">
              {formatCurrency(stats.totalWalletBalance)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT hoặc ID..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">Tất cả ({users.length})</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="SUSPENDED">Tạm khóa</option>
              <option value="BANNED">Khóa vĩnh viễn</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="BUYER">Người mua hàng</option>
              <option value="SELLER_OWNER">Chủ Gian Hàng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Thông tin liên hệ</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Số dư ví</th>
                <th className="py-3.5 px-4 text-center">Đơn hàng</th>
                <th className="py-3.5 px-4">Đăng ký</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Đang tải danh sách người dùng...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>Không tìm thấy người dùng nào phù hợp với bộ lọc.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      user.status === 'BANNED' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center border border-purple-200">
                              {user.fullName[0] || 'U'}
                            </div>
                          )}
                          {user.status === 'BANNED' && (
                            <div
                              title="Tài khoản bị khóa vĩnh viễn"
                              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs"
                            >
                              <Ban className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{user.fullName}</span>
                            {user.accountFlags?.includes('VIP') && (
                              <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            {user.id}
                            <button
                              onClick={() => copyToClipboard(user.id, `id_${user.id}`)}
                              title="Sao chép ID"
                              className="hover:text-purple-600 cursor-pointer"
                            >
                              {copiedField === `id_${user.id}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{user.email}</span>
                          {user.isEmailVerified && (
                            <span title="Email đã xác thực">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        {user.phoneNumber ? (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Chưa có SĐT</span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">{renderRoleBadge(user.role)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div>
                        {renderStatusBadge(user.status)}
                        {user.status === 'BANNED' && user.banReason && (
                          <p className="text-[10px] text-rose-600 font-medium truncate max-w-[150px] mt-1" title={user.banReason}>
                            {user.banReason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Wallet balance */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(user.walletBalance || 0)}
                      </div>
                      <button
                        onClick={() => handleOpenBalanceModal(user)}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-medium hover:underline inline-block mt-0.5 cursor-pointer"
                      >
                        ± Điều chỉnh
                      </button>
                    </td>

                    {/* Orders summary */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-800">{user.totalOrders || 0}</span>
                      <span className="text-slate-400 text-[11px] block">
                        ({formatCurrency(user.totalSpent || 0)})
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4">
                      <span className="text-slate-600 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      {user.lastLoginAt && (
                        <span className="text-slate-400 text-[10px] block">
                          Online: {new Date(user.lastLoginAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail / Support Center */}
                        <button
                          onClick={() => handleOpenDetail(user)}
                          title="Xem thông tin chi tiết & Trung tâm hỗ trợ"
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit profile */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Chỉnh sửa thông tin"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Ban / Unban */}
                        {user.status === 'BANNED' ? (
                          <button
                            onClick={() => handleUnban(user)}
                            title="Mở khóa tài khoản"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenBan(user)}
                            title="Khóa vĩnh viễn tài khoản"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleOpenDelete(user)}
                          title="Xóa tài khoản"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SLIDE-OVER DRAWER: USER DETAIL & CUSTOMER SUPPORT CENTER */}
      {/* ========================================================= */}
      {isDetailDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            onClick={() => setIsDetailDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg flex items-center justify-center">
                      {selectedUser.fullName[0]}
                    </div>
                  )}
                  {selectedUser.status === 'BANNED' && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full">
                      <Ban className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedUser.fullName}</h2>
                    {renderRoleBadge(selectedUser.role)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span>{selectedUser.email}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-[11px] text-purple-300">{selectedUser.id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Toolbar for Customer Support */}
            <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => copyToClipboard(selectedUser.email, 'drawer_email')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
              >
                {copiedField === 'drawer_email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Sao chép Email</span>
              </button>

              {selectedUser.phoneNumber && (
                <button
                  onClick={() => copyToClipboard(selectedUser.phoneNumber!, 'drawer_phone')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {copiedField === 'drawer_phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Sao chép SĐT</span>
                </button>
              )}

              {selectedUser.password && (
                <button
                  onClick={() => copyToClipboard(selectedUser.password!, 'drawer_quick_pwd')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700 text-purple-200 hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {copiedField === 'drawer_quick_pwd' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Sao chép Mật khẩu</span>
                </button>
              )}

              <button
                onClick={() => handleOpenBalanceModal(selectedUser)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cộng/Trừ số dư hỗ trợ</span>
              </button>

              <button
                onClick={() => handleOpenEdit(selectedUser)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            </div>

            {/* Banned Alert Banner if Banned */}
            {selectedUser.status === 'BANNED' && (
              <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-rose-900 block">Tài khoản này đã bị KHÓA VĨNH VIỄN</span>
                  <p className="text-rose-700 mt-0.5">{selectedUser.banReason || 'Vi phạm điều khoản dịch vụ nghiêm trọng.'}</p>
                  {selectedUser.bannedAt && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      Khóa lúc: {new Date(selectedUser.bannedAt).toLocaleString('vi-VN')} {selectedUser.bannedBy ? `bởi ${selectedUser.bannedBy}` : ''}
                    </span>
                  )}
                  <button
                    onClick={() => handleUnban(selectedUser)}
                    className="mt-2 px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3 h-3" />
                    Mở khóa ngay
                  </button>
                </div>
              </div>
            )}

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 px-5 text-xs font-semibold bg-slate-50">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Hồ sơ & Định danh
              </button>
              <button
                onClick={() => setDrawerTab('orders')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  drawerTab === 'orders'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Đơn hàng gần đây ({selectedUser.recentOrders?.length || 0})</span>
              </button>
              <button
                onClick={() => setDrawerTab('notes')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  drawerTab === 'notes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ghi chú hỗ trợ ({selectedUser.adminNotes?.length || 0})</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* TAB 1: OVERVIEW */}
              {drawerTab === 'overview' && (
                <div className="space-y-4">
                  {/* Financial & Order Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 font-medium">Số dư ví hiện có</span>
                      <p className="text-sm font-bold text-indigo-600 mt-1">
                        {formatCurrency(selectedUser.walletBalance || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 font-medium">Tổng số đơn</span>
                      <p className="text-sm font-bold text-slate-800 mt-1">{selectedUser.totalOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 font-medium">Tổng chi tiêu</span>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {formatCurrency(selectedUser.totalSpent || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Personal & Account Information */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Thông tin cá nhân & Tài khoản
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Họ và tên:</span>
                        <span className="font-semibold text-slate-800">{selectedUser.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Trạng thái:</span>
                        <div className="mt-0.5">{renderStatusBadge(selectedUser.status)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Email đăng ký:</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <span>{selectedUser.email}</span>
                          {selectedUser.isEmailVerified ? (
                            <span title="Đã xác thực email">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600">(Chưa xác thực)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Số điện thoại:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedUser.phoneNumber || 'Chưa cung cấp'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Ngày tạo tài khoản:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lần đăng nhập cuối:</span>
                        <span className="font-medium text-slate-700">
                          {selectedUser.lastLoginAt
                            ? new Date(selectedUser.lastLoginAt).toLocaleString('vi-VN')
                            : 'Chưa có thông tin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Định danh KYC:</span>
                        <span
                          className={`font-semibold ${
                            selectedUser.identityVerified ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {selectedUser.identityVerified ? 'Đã xác minh danh tính' : 'Chưa xác minh'}
                        </span>
                      </div>
                      {selectedUser.shopId && (
                        <div>
                          <span className="text-slate-400 block">Shop liên kết:</span>
                          <span className="font-semibold text-indigo-600">{selectedUser.shopId}</span>
                        </div>
                      )}

                      {/* Password Info Row in Drawer */}
                      <div className="col-span-2 p-3 bg-purple-50/70 rounded-xl border border-purple-200 mt-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-purple-600" />
                            Mật khẩu đăng nhập (Hỗ trợ cấp lại cho khách):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowDrawerPassword(!showDrawerPassword)}
                              className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {showDrawerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{showDrawerPassword ? 'Ẩn' : 'Hiện mật khẩu'}</span>
                            </button>
                            {selectedUser.password && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(selectedUser.password!, 'drawer_card_pwd')}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === 'drawer_card_pwd' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Sao chép</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-200">
                          <span className="font-mono font-bold text-slate-800 text-xs tracking-wider">
                            {showDrawerPassword
                              ? selectedUser.password || 'TechMarket@123'
                              : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(selectedUser)}
                            className="text-[11px] text-purple-600 hover:underline font-semibold cursor-pointer"
                          >
                            Đổi mật khẩu
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Flags */}
                  {selectedUser.accountFlags && selectedUser.accountFlags.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-2">Nhãn hồ sơ (Flags):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.accountFlags.map((flag) => (
                          <span
                            key={flag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 font-mono"
                          >
                            #{flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2.5">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                      Vùng quản trị kỷ luật
                    </span>
                    <p className="text-[11px] text-rose-700">
                      Cân nhắc cẩn thận trước khi áp dụng các chế tài vĩnh viễn đối với tài khoản này.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {selectedUser.status !== 'BANNED' && (
                        <button
                          onClick={() => handleOpenBan(selectedUser)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Khóa vĩnh viễn tài khoản
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDelete(selectedUser)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RECENT ORDERS */}
              {drawerTab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">
                      Lịch sử đơn hàng để đối soát hỗ trợ
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Tổng {selectedUser.recentOrders?.length || 0} đơn gần nhất
                    </span>
                  </div>

                  {!selectedUser.recentOrders || selectedUser.recentOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">Chưa có đơn hàng nào được ghi nhận cho người dùng này.</p>
                    </div>
                  ) : (
                    selectedUser.recentOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-purple-700">
                              {ord.orderCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>{new Date(ord.createdAt).toLocaleString('vi-VN')}</span>
                            <span>•</span>
                            <span>{ord.itemsCount} sản phẩm</span>
                            {ord.paymentMethod && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-700">{ord.paymentMethod}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-sm text-slate-900">
                            {formatCurrency(ord.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ADMIN SUPPORT NOTES */}
              {drawerTab === 'notes' && (
                <div className="space-y-4">
                  {/* Form add note */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Thêm ghi chú hỗ trợ nội bộ mới:
                    </label>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Ghi chú nội dung trao đổi, thỏa thuận đền bù, lý do khách khiếu nại..."
                      rows={3}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newNoteText.trim() || isSubmittingNote}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingNote ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes Timeline */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nhật ký hỗ trợ ({selectedUser.adminNotes?.length || 0}):
                    </h4>
                    {!selectedUser.adminNotes || selectedUser.adminNotes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        Chưa có ghi chú hỗ trợ nào.
                      </p>
                    ) : (
                      selectedUser.adminNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-purple-700">{note.adminName}</span>
                            <span className="text-slate-400">
                              {new Date(note.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-line">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL: EDIT USER PROFILE */}
      {/* ========================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Chỉnh sửa thông tin: {selectedUser.fullName}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={editFormData.fullName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>

              {/* Mật khẩu tài khoản & Hỗ trợ cấp lại */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mật khẩu tài khoản (Hỗ trợ khi người dùng quên):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tạo mật khẩu mới</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full pl-3 pr-20 py-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:border-purple-500 text-xs font-mono font-bold text-slate-900 tracking-wider shadow-xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      title={showEditPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="p-1 hover:text-purple-600 cursor-pointer"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {editFormData.password && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(editFormData.password!, 'edit_pwd')}
                        title="Sao chép mật khẩu"
                        className="p-1 hover:text-purple-600 cursor-pointer"
                      >
                        {copiedField === 'edit_pwd' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 Bạn có thể bật icon con mắt để xem mật khẩu, sao chép gửi cho người dùng hoặc nhập mật khẩu mới rồi bấm "Lưu thay đổi".
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vai trò:</label>
                  <select
                    value={editFormData.role || 'BUYER'}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs bg-white"
                  >
                    <option value="BUYER">Người mua hàng (BUYER)</option>
                    <option value="SELLER_OWNER">Chủ gian hàng (SELLER_OWNER)</option>
                    <option value="MODERATOR">Kiểm duyệt viên (MODERATOR)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Trạng thái:</label>
                  <select
                    value={editFormData.status || 'ACTIVE'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs bg-white"
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="SUSPENDED">Tạm khóa (SUSPENDED)</option>
                    <option value="BANNED">Khóa vĩnh viễn (BANNED)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isEmailVerified ?? true}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, isEmailVerified: e.target.checked })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Email đã xác thực</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.identityVerified ?? false}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, identityVerified: e.target.checked })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Đã xác minh KYC</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors text-xs cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: BAN PERMANENTLY (KHÓA VĨNH VIỄN) */}
      {/* ========================================================= */}
      {isBanModalOpen && userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setIsBanModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden z-10">
            <div className="p-4 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-900">Xác nhận KHÓA VĨNH VIỄN tài khoản</h3>
                <span className="text-[11px] text-rose-600 font-medium">Hành động chế tài nghiêm trọng</span>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {userToBan.avatarUrl ? (
                  <img src={userToBan.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center">
                    {userToBan.fullName[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900">{userToBan.fullName}</h4>
                  <span className="text-slate-500 font-mono text-[11px]">{userToBan.email}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Chọn lý do vi phạm chính:
                </label>
                <select
                  value={banReasonPreset}
                  onChange={(e) => setBanReasonPreset(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 text-xs bg-white"
                >
                  <option value="Lừa đảo chiếm đoạt tài khoản game / tài khoản ứng dụng">
                    Lừa đảo chiếm đoạt tài khoản game / tài khoản ứng dụng
                  </option>
                  <option value="Gian lận thanh toán, cố tình chargeback / khiếu nại sai sự thật">
                    Gian lận thanh toán, cố tình chargeback / khiếu nại sai sự thật
                  </option>
                  <option value="Sử dụng công cụ hack/cheat hoặc phát tán phần mềm độc hại">
                    Sử dụng công cụ hack/cheat hoặc phát tán phần mềm độc hại
                  </option>
                  <option value="Vi phạm điều khoản dịch vụ nhiều lần sau khi đã nhắc nhở">
                    Vi phạm điều khoản dịch vụ nhiều lần sau khi đã nhắc nhở
                  </option>
                  <option value="Hành vi quấy rối, xúc phạm nhân viên hỗ trợ hoặc đối tác">
                    Hành vi quấy rối, xúc phạm nhân viên hỗ trợ hoặc đối tác
                  </option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Ghi chú chi tiết vi phạm (bằng chứng):
                </label>
                <textarea
                  value={banReasonDetail}
                  onChange={(e) => setBanReasonDetail(e.target.value)}
                  placeholder="Nhập mã đơn hàng liên quan, bằng chứng hoặc ghi chú lưu vết..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ Sau khi khóa vĩnh viễn, người dùng này sẽ không thể đăng nhập, đặt hàng hoặc rút số dư ví trên toàn bộ hệ thống sàn.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBanModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBan}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors text-xs cursor-pointer shadow-md shadow-rose-600/20"
              >
                Khóa vĩnh viễn ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: DELETE USER (XÓA TÀI KHOẢN) */}
      {/* ========================================================= */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setIsDeleteModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Xóa tài khoản người dùng</h3>
            </div>

            <div className="p-5 text-xs text-slate-600 space-y-3">
              <p>
                Bạn có chắc chắn muốn xóa tài khoản của{' '}
                <strong className="text-slate-900">{userToDelete.fullName}</strong> ({userToDelete.email}) khỏi hệ thống?
              </p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11px]">
                Hành động này sẽ xóa dữ liệu hồ sơ và không thể hoàn tác nếu không có bản sao lưu cơ sở dữ liệu.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors text-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: ADJUST USER WALLET BALANCE (HỖ TRỢ TÀI CHÍNH) */}
      {/* ========================================================= */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setIsBalanceModalOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="p-4 border-b border-slate-200 bg-purple-50 flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Điều chỉnh số dư ví hỗ trợ
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">{selectedUser.fullName}</span>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số dư hiện tại:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(selectedUser.walletBalance || 0)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Loại thao tác:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('ADD')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      balanceAdjustType === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Cộng tiền (Bồi thường)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('SUBTRACT')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      balanceAdjustType === 'SUBTRACT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Trừ tiền (Thu hồi)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Số tiền điều chỉnh (VNĐ):
                </label>
                <input
                  type="number"
                  step={10000}
                  min={10000}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm font-bold"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBalanceAmount(amt)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-semibold cursor-pointer"
                    >
                      +{amt.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lý do hỗ trợ / điều chỉnh (bắt buộc):
                </label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Ví dụ: Đền bù mã thẻ lỗi đơn hàng #ORD-2026..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                <span className="text-purple-800 font-medium">Số dư dự kiến sau điều chỉnh:</span>
                <span className="font-bold text-purple-900 text-sm">
                  {formatCurrency(
                    Math.max(
                      0,
                      (selectedUser.walletBalance || 0) +
                        (balanceAdjustType === 'ADD' ? balanceAmount : -balanceAmount)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBalanceAdjust}
                disabled={balanceAmount <= 0 || !balanceReason.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors text-xs cursor-pointer disabled:opacity-50"
              >
                Xác nhận điều chỉnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
