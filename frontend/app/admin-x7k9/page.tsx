'use client';

import { useState, useEffect } from 'react';
import { Trash2, Users, Shield, LogOut, Search, RefreshCw, AlertTriangle } from 'lucide-react';

const ADMIN_SECRET = 'ab-admin-x9k2p7qm4z';
const SESSION_KEY = 'admin_auth';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  created_at: string;
  presence_status: string;
  is_verified: boolean;
}

interface Group {
  id: string;
  group_number: number;
  name: string;
  description: string | null;
  created_at: string;
  owner_username: string | null;
  owner_display_name: string | null;
  member_count: number;
}

type Tab = 'users' | 'groups';

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'group'; id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Check session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setAuthed(true);
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const login = () => {
    if (password === ADMIN_SECRET) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setLoginError('');
    } else {
      setLoginError('Wrong password.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPassword('');
  };

  const headers = { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/users`, { headers });
      const j = await r.json();
      if (j.success) setUsers(j.data.users);
    } catch { showToast('Failed to load users', false); }
    setLoading(false);
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/groups`, { headers });
      const j = await r.json();
      if (j.success) setGroups(j.data.groups);
    } catch { showToast('Failed to load groups', false); }
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    if (tab === 'users') fetchUsers();
    else fetchGroups();
  }, [authed, tab]);

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, name } = confirmDelete;
    setConfirmDelete(null);
    try {
      const url = type === 'user' ? `${API}/admin/users/${id}` : `${API}/admin/groups/${id}`;
      const r = await fetch(url, { method: 'DELETE', headers });
      const j = await r.json();
      if (j.success) {
        showToast(j.message || `${type} deleted`);
        if (type === 'user') setUsers(prev => prev.filter(u => u.id !== id));
        else setGroups(prev => prev.filter(g => g.id !== id));
      } else {
        showToast(j.message || 'Delete failed', false);
      }
    } catch { showToast('Delete failed', false); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.owner_username || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Admin Panel</h1>
              <p className="text-gray-500 text-xs">AdventureBlox</p>
            </div>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
            {loginError && (
              <p className="text-red-400 text-xs">{loginError}</p>
            )}
            <button
              onClick={login}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl transition-all ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Confirm Delete</p>
                <p className="text-xs text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Delete <span className="font-bold text-white">{confirmDelete.name}</span>?
              {confirmDelete.type === 'user' && ' All their groups, messages and data will be removed.'}
              {confirmDelete.type === 'group' && ' All members, roles and data will be removed.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
            <span className="text-gray-600 text-sm">·</span>
            <span className="text-gray-500 text-xs">AdventureBlox</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-1">Total Users</p>
            <p className="text-3xl font-bold">{users.length > 0 ? users.length : '—'}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-1">Total Groups</p>
            <p className="text-3xl font-bold">{groups.length > 0 ? groups.length : '—'}</p>
          </div>
        </div>

        {/* Tabs + Search + Refresh */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setTab('users'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
            <button
              onClick={() => { setTab('groups'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'groups' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Shield className="w-4 h-4" /> Groups
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={tab === 'users' ? 'Search users…' : 'Search groups…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>
            <button
              onClick={() => tab === 'users' ? fetchUsers() : fetchGroups()}
              className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading…
          </div>
        ) : tab === 'users' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-600">No users found</td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-white">{u.display_name || u.username}</p>
                        <p className="text-gray-500 text-xs">@{u.username}{u.is_verified && ' ✓'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{fmt(u.created_at)}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                        u.presence_status === 'online' ? 'bg-green-900/50 text-green-400' :
                        u.presence_status === 'in-game' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-gray-800 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.presence_status === 'online' ? 'bg-green-400' :
                          u.presence_status === 'in-game' ? 'bg-blue-400' : 'bg-gray-600'
                        }`} />
                        {u.presence_status || 'offline'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.username })}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Group</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Owner</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Members</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Created</th>
                  <th className="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-600">No groups found</td>
                  </tr>
                ) : filteredGroups.map(g => (
                  <tr key={g.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-white">{g.name}</p>
                        <p className="text-gray-500 text-xs">#{g.group_number}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">
                      {g.owner_display_name || g.owner_username || '—'}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">{g.member_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{fmt(g.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setConfirmDelete({ type: 'group', id: g.id, name: g.name })}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
