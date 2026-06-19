import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const ROLES = ['admin', 'manager', 'cashier', 'factory_worker', 'accountant']
const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', cashier: 'Cashier', factory_worker: 'Factory Worker', accountant: 'Accountant' }
const ROLE_COLORS = {
  admin:          'bg-violet-100 text-violet-700',
  manager:        'bg-blue-100 text-blue-700',
  cashier:        'bg-emerald-100 text-emerald-700',
  factory_worker: 'bg-amber-100 text-amber-700',
  accountant:     'bg-pink-100 text-pink-700',
}
const ROLE_GRADIENTS = {
  admin:          'from-violet-500 to-purple-600',
  manager:        'from-blue-500 to-indigo-600',
  cashier:        'from-emerald-500 to-teal-600',
  factory_worker: 'from-amber-500 to-orange-600',
  accountant:     'from-pink-500 to-rose-600',
}

const emptyForm = () => ({ username: '', first_name: '', last_name: '', email: '', phone: '', role: 'cashier', password: '', password2: '', is_active: true })

const inp  = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50'
const lbl  = 'block text-xs font-semibold text-gray-600 mb-1'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)   // null = new, obj = editing
  const [form, setForm]         = useState(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [search, setSearch]     = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('users/')
      setUsers(res.data?.results ?? res.data ?? [])
    } catch { setUsers([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openNew = () => {
    setEditUser(null)
    setForm(emptyForm())
    setError(''); setSuccess('')
    setShowModal(true)
  }

  const openEdit = u => {
    setEditUser(u)
    setForm({ username: u.username, first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', phone: u.phone || '', role: u.role, password: '', password2: '', is_active: u.is_active })
    setError(''); setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setError(''); setSuccess('') }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!form.username.trim()) { setError('Username is required.'); return }
    if (!editUser && !form.password) { setError('Password is required for new users.'); return }
    if (form.password && form.password !== form.password2) { setError('Passwords do not match.'); return }
    if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setSaving(true)
    try {
      const payload = { username: form.username.trim(), first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, role: form.role, is_active: form.is_active }
      if (form.password) payload.password = form.password

      if (editUser) {
        await api.patch(`users/${editUser.id}/`, payload)
        setSuccess('User updated successfully.')
      } else {
        await api.post('users/', payload)
        setSuccess('User created successfully.')
      }
      await fetchUsers()
      setTimeout(() => closeModal(), 1000)
    } catch (e) {
      const data = e?.response?.data
      if (data?.username) setError(`Username: ${data.username[0]}`)
      else if (data?.password) setError(`Password: ${data.password[0]}`)
      else if (data?.detail) setError(data.detail)
      else setError('Failed to save user. Check all fields.')
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    try {
      await api.delete(`users/${id}/`)
      setUsers(prev => prev.filter(u => u.id !== id))
      setConfirmDelete(null)
    } catch { alert('Failed to delete user.') }
  }

  const toggleActive = async u => {
    try {
      await api.patch(`users/${u.id}/`, { is_active: !u.is_active })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
    } catch { alert('Failed to update user.') }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.username.toLowerCase().includes(q) || (u.first_name + ' ' + u.last_name).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  const initials = u => ((u.first_name?.[0] || '') + (u.last_name?.[0] || '') || u.username?.[0] || '?').toUpperCase()

  // role counts
  const roleCounts = {}
  ROLES.forEach(r => { roleCounts[r] = users.filter(u => u.role === r).length })

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9]">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10"
          style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#4f46e5 0%,transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />

          <div className="relative z-10 flex items-start justify-between mb-8">
            <div>
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Administration</p>
              <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
              <p className="text-white/50 text-sm">Manage accounts, roles, and access control</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all mt-1"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New User
            </button>
          </div>

          {/* Role breakdown cards */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {ROLES.map((r, i) => (
              <div key={r} className="rounded-2xl p-4 card-hover animate-fadeIn"
                style={{ animationDelay: `${i * 60}ms`, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className="text-white/50 text-xs font-medium mb-2">{ROLE_LABELS[r]}</p>
                <p className="text-2xl font-bold text-white">{roleCounts[r]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Search */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Users grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold">{search ? 'No users match your search' : 'No users yet'}</p>
              {!search && <button onClick={openNew} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ Create First User</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(u => (
                <div key={u.id} className={`bg-white rounded-2xl border shadow-sm p-5 card-hover transition-all ${!u.is_active ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ROLE_GRADIENTS[u.role] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        {initials(u)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[110px]">
                          {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[110px]">@{u.username}</p>
                      </div>
                    </div>
                    {/* Active dot */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${u.is_active ? 'bg-emerald-400' : 'bg-gray-300'}`} title={u.is_active ? 'Active' : 'Inactive'} />
                  </div>

                  {/* Role badge */}
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>

                  {/* Contact info */}
                  <div className="mt-3 space-y-1">
                    {u.email && <p className="text-xs text-gray-400 truncate">✉ {u.email}</p>}
                    {u.phone && <p className="text-xs text-gray-400">📞 {u.phone}</p>}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <button onClick={() => openEdit(u)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleActive(u)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.is_active ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.id !== me?.id && (
                      <button onClick={() => setConfirmDelete(u)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-gray-900 text-lg">{editUser ? `Edit — ${editUser.username}` : 'New User'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl transition-colors">×</button>
            </div>

            <div className="p-6 space-y-4">
              {error   && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
              {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3">✓ {success}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={lbl}>Username <span className="text-red-500">*</span></label>
                  <input className={inp} value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. john_doe" disabled={!!editUser} />
                  {editUser && <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>}
                </div>
                <div>
                  <label className={lbl}>First Name</label>
                  <input className={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First" />
                </div>
                <div>
                  <label className={lbl}>Last Name</label>
                  <input className={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last" />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className={lbl}>Role <span className="text-red-500">*</span></label>
                  <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button type="button"
                    onClick={() => set('is_active', !form.is_active)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <label className="text-sm font-medium text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</label>
                </div>
              </div>

              {/* Password section */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {editUser ? 'Change Password (leave blank to keep current)' : 'Set Password'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{editUser ? 'New Password' : 'Password'} {!editUser && <span className="text-red-500">*</span>}</label>
                    <input type="password" className={inp} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" />
                  </div>
                  <div>
                    <label className={lbl}>Confirm Password</label>
                    <input type="password" className={inp} value={form.password2} onChange={e => set('password2', e.target.value)} placeholder="Repeat password" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete User?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently delete <strong>{confirmDelete.username}</strong>. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
