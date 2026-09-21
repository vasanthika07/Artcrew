import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Edit3,
  Shield,
  User,
  Smartphone,
  Eye,
  Plus,
  RefreshCw,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { toast } from '../../components/Toast';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const formatSeconds = (sec = 0) => {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatDurationHM = (sec = 0) => {
  if (!sec) return '0 min';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
};

const TIER_BADGE = {
  basic: 'badge-primary',
  pro: 'badge-warning',
  studio: 'badge-success',
};

// Generic modal container
const Modal = ({ title, onClose, maxWidth = 'max-w-2xl', children }) => (
  <div className="fixed inset-0 bg-charcoal-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div
      className={`bg-white rounded-2xl shadow-dark w-full ${maxWidth} animate-fade-up max-h-[90vh] overflow-y-auto flex flex-col`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-5 border-b border-charcoal-100 shrink-0">
        <h3 className="font-display font-semibold text-lg text-charcoal-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-charcoal-100 text-charcoal-400 hover:text-charcoal-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const AdminProgress = () => {
  const [searchParams] = useSearchParams();
  const initialUserParam = searchParams.get('user') || '';

  // Main data state
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [mediums, setMediums] = useState([]);
  const [recordingsList, setRecordingsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState(initialUserParam);
  const [statusFilter, setStatusFilter] = useState('all');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modals state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ progressPercentage: 0, progressSeconds: 0, isCompleted: false });
  const [savingEdit, setSavingEdit] = useState(false);

  // Access Modal state
  const [accessUser, setAccessUser] = useState(null);
  const [accessForm, setAccessForm] = useState({
    role: 'user',
    subscriptionTier: 'basic',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: '',
    isSuspended: false,
    maxDevices: 2,
  });
  const [savingAccess, setSavingAccess] = useState(false);

  // Deep-dive Student Modal
  const [deepDiveUserId, setDeepDiveUserId] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [loadingDeepDive, setLoadingDeepDive] = useState(false);

  // Add Progress Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    userId: '',
    recordingId: '',
    progressPercentage: 100,
    isCompleted: true,
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    action: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Fetch stats & filter dropdown options
  const loadStatsAndMeta = async () => {
    try {
      const [statsRes, mediumsRes, recsRes, usersRes] = await Promise.all([
        api.get('/admin/progress/stats'),
        api.get('/mediums'),
        api.get('/recordings?limit=100'),
        api.get('/admin/users?limit=100'),
      ]);
      setStats(statsRes.data.data);
      setMediums(mediumsRes.data.data || []);
      setRecordingsList(recsRes.data.data || []);
      setUsersList(usersRes.data.data || []);
    } catch (err) {
      console.error('Error loading metadata/stats:', err);
    }
  };

  // Fetch progress records
  const loadRecords = () => {
    setLoading(true);
    api
      .get('/admin/progress', {
        params: {
          search: search || undefined,
          userId: userFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          mediumId: mediumFilter !== 'all' ? mediumFilter : undefined,
          page,
          limit: 20,
        },
      })
      .then((res) => {
        setRecords(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load user progress records');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatsAndMeta();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, userFilter, statusFilter, mediumFilter, page]);

  // Open Edit Progress Modal
  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setEditForm({
      progressPercentage: rec.progressPercentage || 0,
      progressSeconds: rec.progressSeconds || 0,
      isCompleted: rec.isCompleted || false,
    });
  };

  // Save Progress Edit
  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const userId = editingRecord.userId._id || editingRecord.userId;
      const recordingId = editingRecord.recordingId._id || editingRecord.recordingId;

      await api.put(`/admin/progress/user/${userId}/recording/${recordingId}`, {
        progressPercentage: Number(editForm.progressPercentage),
        progressSeconds: Number(editForm.progressSeconds),
        isCompleted: Boolean(editForm.isCompleted),
      });

      toast.success('User progress successfully updated');
      setEditingRecord(null);
      loadRecords();
      loadStatsAndMeta();
      if (deepDiveUserId === userId) {
        fetchDeepDive(userId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setSavingEdit(false);
    }
  };

  // 1-Click Fast-Track Complete
  const handleQuickComplete = (rec) => {
    const userId = rec.userId._id || rec.userId;
    const recordingId = rec.recordingId._id || rec.recordingId;
    const studentName = rec.userId?.name || 'Student';
    const title = rec.recordingId?.title || 'Session';

    setConfirmState({
      isOpen: true,
      title: 'Mark Session as 100% Completed',
      message: `Set "${title}" as fully completed for ${studentName}? This will set progress to 100% and unlock completion status.`,
      confirmText: 'Mark 100% Complete',
      confirmVariant: 'primary',
      action: async () => {
        await api.put(`/admin/progress/user/${userId}/recording/${recordingId}`, {
          progressPercentage: 100,
          isCompleted: true,
        });
        toast.success(`Marked complete for ${studentName}`);
        loadRecords();
        loadStatsAndMeta();
        if (deepDiveUserId === userId) fetchDeepDive(userId);
      },
    });
  };

  // Reset Progress
  const handleResetProgress = (rec) => {
    const userId = rec.userId._id || rec.userId;
    const recordingId = rec.recordingId._id || rec.recordingId;
    const studentName = rec.userId?.name || 'Student';

    setConfirmState({
      isOpen: true,
      title: 'Reset User Progress',
      message: `Reset watch progress for ${studentName}? The student will start this recording from 0:00.`,
      confirmText: 'Reset to 0%',
      confirmVariant: 'danger',
      action: async () => {
        await api.put(`/admin/progress/user/${userId}/recording/${recordingId}`, {
          progressPercentage: 0,
          progressSeconds: 0,
          isCompleted: false,
        });
        toast.success(`Progress reset for ${studentName}`);
        loadRecords();
        loadStatsAndMeta();
        if (deepDiveUserId === userId) fetchDeepDive(userId);
      },
    });
  };

  // Delete Progress Entry completely
  const handleDeleteProgress = (rec) => {
    const userId = rec.userId._id || rec.userId;
    const recordingId = rec.recordingId._id || rec.recordingId;
    const studentName = rec.userId?.name || 'Student';

    setConfirmState({
      isOpen: true,
      title: 'Delete Progress Entry',
      message: `Permanently delete progress entry for ${studentName}?`,
      confirmText: 'Delete Entry',
      confirmVariant: 'danger',
      action: async () => {
        await api.delete(`/admin/progress/user/${userId}/recording/${recordingId}`);
        toast.success('Progress entry removed');
        loadRecords();
        loadStatsAndMeta();
        if (deepDiveUserId === userId) fetchDeepDive(userId);
      },
    });
  };

  // Open Access Management Modal
  const handleOpenAccess = async (user) => {
    setAccessUser(user);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      const fullUser = res.data.data;
      setAccessUser(fullUser);
      setAccessForm({
        role: fullUser.role || 'user',
        subscriptionTier: fullUser.subscriptionTier || 'basic',
        subscriptionStatus: fullUser.subscriptionStatus || 'active',
        subscriptionExpiresAt: fullUser.subscriptionExpiresAt
          ? format(new Date(fullUser.subscriptionExpiresAt), 'yyyy-MM-dd')
          : '',
        isSuspended: Boolean(fullUser.isSuspended),
        maxDevices: fullUser.maxDevices || 2,
      });
    } catch (err) {
      setAccessForm({
        role: user.role || 'user',
        subscriptionTier: user.subscriptionTier || 'basic',
        subscriptionStatus: user.subscriptionStatus || 'active',
        subscriptionExpiresAt: user.subscriptionExpiresAt
          ? format(new Date(user.subscriptionExpiresAt), 'yyyy-MM-dd')
          : '',
        isSuspended: Boolean(user.isSuspended),
        maxDevices: user.maxDevices || 2,
      });
    }
  };

  // Save Access Changes
  const handleSaveAccess = async (e) => {
    e?.preventDefault();
    if (!accessUser) return;
    setSavingAccess(true);
    try {
      await api.put(`/admin/users/${accessUser._id}`, {
        role: accessForm.role,
        subscriptionTier: accessForm.subscriptionTier,
        subscriptionStatus: accessForm.subscriptionStatus,
        subscriptionExpiresAt: accessForm.subscriptionExpiresAt || null,
        isSuspended: accessForm.isSuspended,
        maxDevices: Number(accessForm.maxDevices),
      });

      toast.success(`Access updated for ${accessUser.name}`);
      setAccessUser(null);
      loadRecords();
      loadStatsAndMeta();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user access');
    } finally {
      setSavingAccess(false);
    }
  };

  // Force Logout a Device
  const handleForceLogoutDevice = async (deviceId, devName) => {
    if (!accessUser) return;
    try {
      await api.delete(`/admin/users/${accessUser._id}/devices/${deviceId}`);
      toast.success(`Logged out "${devName || 'Device'}"`);
      setAccessUser((prev) => ({
        ...prev,
        devices: prev.devices?.filter((d) => d.deviceId !== deviceId),
      }));
    } catch (err) {
      toast.error('Failed to logout device');
    }
  };

  // Fetch Student Deep Dive
  const fetchDeepDive = async (userId) => {
    setDeepDiveUserId(userId);
    setLoadingDeepDive(true);
    try {
      const res = await api.get(`/admin/progress/user/${userId}`);
      setDeepDiveData(res.data.data);
    } catch (err) {
      toast.error('Failed to load student progress deep dive');
    } finally {
      setLoadingDeepDive(false);
    }
  };

  // Submit Add / Assign Progress
  const handleAddProgress = async (e) => {
    e?.preventDefault();
    if (!addForm.userId || !addForm.recordingId) {
      toast.error('Please select both a student and a session');
      return;
    }
    setSubmittingAdd(true);
    try {
      await api.post(`/admin/progress/user/${addForm.userId}`, {
        recordingId: addForm.recordingId,
        progressPercentage: Number(addForm.progressPercentage),
        isCompleted: Boolean(addForm.isCompleted),
      });

      toast.success('Progress successfully assigned to student');
      setAddModalOpen(false);
      setAddForm({ userId: '', recordingId: '', progressPercentage: 100, isCompleted: true });
      loadRecords();
      loadStatsAndMeta();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign progress');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Execute confirm action
  const executeConfirmAction = async () => {
    if (!confirmState.action) return;
    setConfirmLoading(true);
    try {
      await confirmState.action();
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-charcoal-900">
              User Progress & Access Control
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-canvas-100 text-canvas-800 border border-canvas-200">
              Live Tracker
            </span>
          </div>
          <p className="text-charcoal-500 text-sm mt-0.5">
            Track student learning journeys across all mediums, manually adjust progress milestones, and manage membership access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              loadRecords();
              loadStatsAndMeta();
            }}
            className="btn-secondary btn-sm"
            title="Refresh tracker"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary btn-sm shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Progress
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Watch Time */}
        <div className="card p-4 border border-canvas-500/20 bg-gradient-to-br from-white to-canvas-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Total Watched
            </span>
            <div className="w-8 h-8 rounded-xl bg-canvas-500/15 text-canvas-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-charcoal-900 mt-2">
            {stats ? `${stats.totalHours} hrs` : '—'}
          </p>
          <p className="text-[11px] text-charcoal-400 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-canvas-500" /> Across all recorded sessions
          </p>
        </div>

        {/* Card 2: Completed Sessions */}
        <div className="card p-4 border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Completed Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-emerald-950 mt-2">
            {stats ? stats.completedCount : '—'}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {stats ? `${stats.avgCompletionRate}% overall completion rate` : 'Tracking progress'}
          </p>
        </div>

        {/* Card 3: In-Progress Sessions */}
        <div className="card p-4 border border-amber-200 bg-gradient-to-br from-white to-amber-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              In-Progress Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-amber-950 mt-2">
            {stats ? stats.inProgressCount : '—'}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Active watching queue
          </p>
        </div>

        {/* Card 4: Active Learners */}
        <div className="card p-4 border border-purple-200 bg-gradient-to-br from-white to-purple-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Active Learners
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-purple-950 mt-2">
            {stats ? stats.uniqueLearnersCount : '—'}
          </p>
          <p className="text-[11px] text-purple-600 mt-0.5">
            Enrolled student accounts
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or session title..."
            className="input pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Student Filter */}
          <select
            className="input py-2 text-sm w-auto"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Students</option>
            {usersList.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="input py-2 text-sm w-auto"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed (100% / ≥90%)</option>
            <option value="in-progress">In Progress (1% – 89%)</option>
            <option value="not-started">Not Started (0%)</option>
          </select>

          {/* Medium Filter */}
          <select
            className="input py-2 text-sm w-auto"
            value={mediumFilter}
            onChange={(e) => {
              setMediumFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Art Mediums</option>
            {mediums.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Table */}
      {loading ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <EmptyState
          title="No progress records found"
          description="No student watch activity matches your selected filters. You can use 'Assign Progress' above to record student progress."
        />
      ) : (
        <div className="card overflow-x-auto shadow-sm">
          <table className="table-art">
            <thead>
              <tr>
                <th>Student</th>
                <th>Art Session</th>
                <th>Progress & Watched Time</th>
                <th>Status</th>
                <th>Last Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const user = rec.userId || {};
                const session = rec.recordingId || {};
                const percent = rec.progressPercentage || 0;
                const duration = rec.durationSeconds || session.durationSeconds || 0;
                const watched = rec.progressSeconds || 0;

                return (
                  <tr key={rec._id} className="hover:bg-charcoal-50/80 transition-colors">
                    {/* Student Column */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-canvas-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-charcoal-900 text-sm truncate">
                              {user.name || 'Anonymous User'}
                            </p>
                            {user.role === 'admin' && (
                              <span className="badge bg-amber-100 text-amber-800 text-[10px] px-1 py-0 font-bold">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-charcoal-400 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`badge text-[10px] py-0 px-1.5 ${
                                TIER_BADGE[user.subscriptionTier] || 'badge-muted'
                              }`}
                            >
                              {user.subscriptionTier || 'Free'}
                            </span>
                            {user.isSuspended && (
                              <span className="badge badge-danger text-[10px] py-0 px-1">
                                Suspended
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Session Column */}
                    <td>
                      <div className="min-w-0 max-w-xs">
                        <p className="font-semibold text-charcoal-900 text-sm truncate">
                          {session.title || 'Untitled Session'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-charcoal-400">
                          {session.mediumId?.name && (
                            <span className="text-canvas-600 font-medium">
                              {session.mediumId.name}
                            </span>
                          )}
                          <span>•</span>
                          <span>Total: {formatDurationHM(duration)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Progress Bar & Watch Time Column */}
                    <td className="min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-charcoal-900">
                            {percent}%
                          </span>
                          <span className="text-charcoal-500 text-[11px] font-mono">
                            {formatSeconds(watched)} / {formatSeconds(duration)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-charcoal-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              rec.isCompleted || percent >= 90
                                ? 'bg-emerald-500'
                                : percent > 0
                                ? 'bg-gradient-to-r from-canvas-500 to-terracotta-500'
                                : 'bg-charcoal-300'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge Column */}
                    <td>
                      <span
                        className={`badge text-xs font-semibold ${
                          rec.isCompleted || percent >= 90
                            ? 'badge-success'
                            : percent > 0
                            ? 'badge-warning'
                            : 'badge-muted'
                        }`}
                      >
                        {rec.isCompleted || percent >= 90
                          ? 'Completed'
                          : percent > 0
                          ? 'In Progress'
                          : 'Not Started'}
                      </span>
                    </td>

                    {/* Last Active Column */}
                    <td className="text-xs text-charcoal-500 whitespace-nowrap">
                      {rec.lastWatchedAt
                        ? format(new Date(rec.lastWatchedAt), 'dd MMM yyyy, p')
                        : '—'}
                    </td>

                    {/* Actions Column */}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Progress */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit User Progress"
                          className="btn-ghost btn-sm text-canvas-600 hover:bg-canvas-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Fast 1-Click Complete */}
                        {!(rec.isCompleted || percent >= 100) && (
                          <button
                            type="button"
                            onClick={() => handleQuickComplete(rec)}
                            title="Mark 100% Completed"
                            className="btn-ghost btn-sm text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reset to 0 */}
                        {percent > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetProgress(rec)}
                            title="Reset Progress to 0%"
                            className="btn-ghost btn-sm text-amber-600 hover:bg-amber-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Deep Dive User All Sessions */}
                        <button
                          type="button"
                          onClick={() => fetchDeepDive(user._id)}
                          title="View Student Course Breakdown"
                          className="btn-ghost btn-sm text-purple-600 hover:bg-purple-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Manage User Access */}
                        <button
                          type="button"
                          onClick={() => handleOpenAccess(user)}
                          title="Manage User Access & Subscription"
                          className="btn-ghost btn-sm text-charcoal-600 hover:bg-charcoal-100"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-charcoal-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-charcoal-700 font-semibold px-2">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Progress Modal */}
      {editingRecord && (
        <Modal
          title={`Edit Progress: ${editingRecord.userId?.name || 'Student'}`}
          onClose={() => setEditingRecord(null)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="p-3 bg-charcoal-50 rounded-xl border border-charcoal-100">
              <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Session
              </p>
              <p className="font-semibold text-charcoal-900 text-sm mt-0.5">
                {editingRecord.recordingId?.title}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Total Length: {formatSeconds(editingRecord.durationSeconds || editingRecord.recordingId?.durationSeconds)} (
                {formatDurationHM(editingRecord.durationSeconds || editingRecord.recordingId?.durationSeconds)})
              </p>
            </div>

            {/* Slider & Numeric Percentage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal-700">
                  Progress Percentage (%)
                </label>
                <span className="text-sm font-mono font-bold text-canvas-700">
                  {editForm.progressPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={editForm.progressPercentage}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const total =
                    editingRecord.durationSeconds || editingRecord.recordingId?.durationSeconds || 100;
                  setEditForm({
                    ...editForm,
                    progressPercentage: val,
                    progressSeconds: Math.round((val / 100) * total),
                    isCompleted: val >= 90,
                  });
                }}
                className="w-full accent-canvas-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-charcoal-400 font-mono mt-1">
                <span>0% (Not Started)</span>
                <span>50% (Halfway)</span>
                <span>100% (Completed)</span>
              </div>
            </div>

            {/* Exact Watched Seconds */}
            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Watched Time (in seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={editingRecord.durationSeconds || editingRecord.recordingId?.durationSeconds || 99999}
                  value={editForm.progressSeconds}
                  onChange={(e) => {
                    const sec = Number(e.target.value);
                    const total =
                      editingRecord.durationSeconds || editingRecord.recordingId?.durationSeconds || 1;
                    const pct = Math.min(100, Math.round((sec / total) * 100));
                    setEditForm({
                      ...editForm,
                      progressSeconds: sec,
                      progressPercentage: pct,
                      isCompleted: pct >= 90,
                    });
                  }}
                  className="input flex-1"
                />
                <span className="text-xs font-mono font-semibold text-charcoal-600 bg-charcoal-100 px-3 py-2 rounded-xl border border-charcoal-200">
                  = {formatSeconds(editForm.progressSeconds)}
                </span>
              </div>
            </div>

            {/* Completed Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-charcoal-200 bg-white">
              <div>
                <p className="text-xs font-semibold text-charcoal-800">
                  Mark as Officially Completed
                </p>
                <p className="text-[11px] text-charcoal-400">
                  User receives completion credit for this art session
                </p>
              </div>
              <input
                type="checkbox"
                checked={editForm.isCompleted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditForm({
                    ...editForm,
                    isCompleted: checked,
                    progressPercentage: checked && editForm.progressPercentage < 90 ? 100 : editForm.progressPercentage,
                  });
                }}
                className="w-5 h-5 accent-canvas-500 rounded cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-charcoal-100">
              <button
                type="button"
                onClick={() => handleDeleteProgress(editingRecord)}
                className="btn-danger btn-sm"
              >
                Delete Record
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary btn-sm"
                >
                  {savingEdit ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: User Access & Permissions Modal */}
      {accessUser && (
        <Modal
          title={`Manage Access: ${accessUser.name}`}
          onClose={() => setAccessUser(null)}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveAccess} className="space-y-4">
            {/* User Overview */}
            <div className="flex items-center gap-3 p-3 bg-charcoal-50 rounded-xl border border-charcoal-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-canvas-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {accessUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-charcoal-900 text-sm">{accessUser.name}</p>
                <p className="text-xs text-charcoal-400">{accessUser.email}</p>
              </div>
            </div>

            {/* Role & Subscription Tier Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  User Role
                </label>
                <select
                  value={accessForm.role}
                  onChange={(e) => setAccessForm({ ...accessForm, role: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="user">Student / User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Membership Tier
                </label>
                <select
                  value={accessForm.subscriptionTier}
                  onChange={(e) =>
                    setAccessForm({ ...accessForm, subscriptionTier: e.target.value })
                  }
                  className="input w-full text-sm"
                >
                  <option value="basic">Basic (Entry)</option>
                  <option value="pro">Pro (All Access)</option>
                  <option value="studio">Studio Access</option>
                </select>
              </div>
            </div>

            {/* Subscription Status & Expiration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Subscription Status
                </label>
                <select
                  value={accessForm.subscriptionStatus}
                  onChange={(e) =>
                    setAccessForm({ ...accessForm, subscriptionStatus: e.target.value })
                  }
                  className="input w-full text-sm"
                >
                  <option value="active">Active</option>
                  <option value="none">Free / None</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Subscription Expiry Date
                </label>
                <input
                  type="date"
                  value={accessForm.subscriptionExpiresAt}
                  onChange={(e) =>
                    setAccessForm({ ...accessForm, subscriptionExpiresAt: e.target.value })
                  }
                  className="input w-full text-sm"
                />
              </div>
            </div>

            {/* Max Allowed Devices & Suspension */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Max Devices Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={accessForm.maxDevices}
                  onChange={(e) =>
                    setAccessForm({ ...accessForm, maxDevices: Number(e.target.value) })
                  }
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="suspend-checkbox"
                    checked={accessForm.isSuspended}
                    onChange={(e) =>
                      setAccessForm({ ...accessForm, isSuspended: e.target.checked })
                    }
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <label htmlFor="suspend-checkbox" className="text-xs font-medium text-red-600 cursor-pointer">
                    Suspend account access
                  </label>
                </div>
              </div>
            </div>

            {/* Active Device Sessions */}
            {accessUser.devices && accessUser.devices.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-terracotta-600" />
                  Active Device Sessions ({accessUser.devices.length} / {accessUser.maxDevices || 2})
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {accessUser.devices.map((dev) => (
                    <div
                      key={dev.deviceId}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-charcoal-200 bg-white text-xs"
                    >
                      <div>
                        <p className="font-semibold text-charcoal-800">
                          {dev.deviceName || 'Web / Mobile Client'}
                        </p>
                        <p className="text-[10px] text-charcoal-400">
                          Last active: {dev.lastActiveAt ? format(new Date(dev.lastActiveAt), 'dd MMM, p') : 'Recent'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleForceLogoutDevice(dev.deviceId, dev.deviceName)}
                        className="btn-ghost btn-sm text-red-500 hover:bg-red-50 text-[11px] py-1 px-2"
                      >
                        <LogOut className="w-3 h-3 mr-1" /> Terminate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
              <button
                type="button"
                onClick={() => setAccessUser(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAccess}
                className="btn-primary btn-sm"
              >
                {savingAccess ? 'Updating...' : 'Save Access Settings'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Student Deep-Dive Course Breakdown */}
      {deepDiveUserId && (
        <Modal
          title="Student Learning Progress Deep-Dive"
          onClose={() => {
            setDeepDiveUserId(null);
            setDeepDiveData(null);
          }}
          maxWidth="max-w-3xl"
        >
          {loadingDeepDive ? (
            <LoadingState />
          ) : !deepDiveData ? (
            <EmptyState title="User data not found" />
          ) : (
            <div className="space-y-5">
              {/* Top Banner */}
              <div className="flex items-center justify-between p-4 bg-charcoal-900 text-white rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-charcoal-950 font-bold text-lg">
                    {deepDiveData.user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base">{deepDiveData.user?.name}</h4>
                    <p className="text-xs text-charcoal-400">{deepDiveData.user?.email}</p>
                    <span className="badge badge-primary text-[10px] mt-1 inline-block">
                      Tier: {deepDiveData.user?.subscriptionTier || 'Free'} ({deepDiveData.user?.subscriptionStatus || 'none'})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-display font-bold text-canvas-400">
                    {deepDiveData.stats?.overallCompletionRate}%
                  </span>
                  <p className="text-[11px] text-charcoal-400">Overall Course Progress</p>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-charcoal-50 rounded-xl border border-charcoal-100">
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Total Sessions</span>
                  <span className="font-display font-bold text-base text-charcoal-900">
                    {deepDiveData.stats?.totalRecordings}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Completed</span>
                  <span className="font-display font-bold text-base text-emerald-900">
                    {deepDiveData.stats?.completedSessionsCount}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-amber-700 block text-[10px] uppercase font-bold">In Progress</span>
                  <span className="font-display font-bold text-base text-amber-900">
                    {deepDiveData.stats?.inProgressSessionsCount}
                  </span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-purple-700 block text-[10px] uppercase font-bold">Watched Time</span>
                  <span className="font-display font-bold text-base text-purple-900">
                    {deepDiveData.stats?.totalWatchHours} hrs
                  </span>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <h5 className="font-display font-semibold text-charcoal-900 text-sm">
                  Course Sessions & Watched Progress
                </h5>
                {deepDiveData.sessions.map((item) => (
                  <div
                    key={item.recording._id}
                    className="p-3 rounded-xl border border-charcoal-200 bg-white hover:border-charcoal-300 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-charcoal-900 truncate">
                          {item.recording.title}
                        </span>
                        {item.recording.mediumId?.name && (
                          <span className="badge badge-muted text-[10px] py-0">
                            {item.recording.mediumId.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <div className="w-32 h-1.5 rounded-full bg-charcoal-200 overflow-hidden">
                          <div
                            className={`h-full ${
                              item.isCompleted ? 'bg-emerald-500' : 'bg-canvas-500'
                            }`}
                            style={{ width: `${item.progressPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-charcoal-600 font-semibold">
                          {item.progressPercentage}% ({formatSeconds(item.progressSeconds)} /{' '}
                          {formatSeconds(item.durationSeconds)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEdit({
                            ...item,
                            userId: deepDiveData.user,
                            recordingId: item.recording,
                          })
                        }
                        className="btn-ghost btn-sm text-canvas-600 hover:bg-canvas-50"
                        title="Edit session progress"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!(item.isCompleted || item.progressPercentage >= 100) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickComplete({
                              userId: deepDiveData.user,
                              recordingId: item.recording,
                            })
                          }
                          className="btn-ghost btn-sm text-emerald-600 hover:bg-emerald-50"
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL 4: Assign / Add Progress Modal */}
      {addModalOpen && (
        <Modal
          title="Assign User Progress"
          onClose={() => setAddModalOpen(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleAddProgress} className="space-y-4">
            {/* Select User */}
            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Select Student / User
              </label>
              <select
                value={addForm.userId}
                onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
                required
                className="input w-full text-sm"
              >
                <option value="">-- Choose Student --</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Session */}
            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Select Art Session / Recording
              </label>
              <select
                value={addForm.recordingId}
                onChange={(e) => setAddForm({ ...addForm, recordingId: e.target.value })}
                required
                className="input w-full text-sm"
              >
                <option value="">-- Choose Art Session --</option>
                {recordingsList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title} ({formatDurationHM(r.durationSeconds)})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Percentage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal-700">
                  Target Progress (%)
                </label>
                <span className="text-sm font-mono font-bold text-canvas-700">
                  {addForm.progressPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={addForm.progressPercentage}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAddForm({
                    ...addForm,
                    progressPercentage: val,
                    isCompleted: val >= 90,
                  });
                }}
                className="w-full accent-canvas-500 cursor-pointer"
              />
            </div>

            {/* Completed status checkbox */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-charcoal-200 bg-charcoal-50">
              <div>
                <p className="text-xs font-semibold text-charcoal-800">
                  Mark as Officially Completed
                </p>
                <p className="text-[11px] text-charcoal-400">
                  Set session status as completed
                </p>
              </div>
              <input
                type="checkbox"
                checked={addForm.isCompleted}
                onChange={(e) => setAddForm({ ...addForm, isCompleted: e.target.checked })}
                className="w-4 h-4 accent-canvas-500 rounded cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAdd}
                className="btn-primary btn-sm"
              >
                {submittingAdd ? 'Assigning...' : 'Assign Progress'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        loading={confirmLoading}
        onConfirm={executeConfirmAction}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminProgress;
