import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const PROVINCES = [
  { value: 'punjab',      label: 'Punjab',                    authority: 'PRA' },
  { value: 'sindh',       label: 'Sindh',                     authority: 'SRB' },
  { value: 'kpk',         label: 'Khyber Pakhtunkhwa (KPK)', authority: 'KPRA' },
  { value: 'balochistan', label: 'Balochistan',               authority: 'BRA' },
  { value: 'federal',     label: 'Federal / Islamabad',       authority: 'FBR' },
  { value: 'ajk',         label: 'AJK',                       authority: 'FBR' },
  { value: 'gb',          label: 'Gilgit-Baltistan',          authority: 'FBR' },
]

const PROVINCE_MAP = Object.fromEntries(PROVINCES.map(p => [p.value, p]))

const emptyForm = () => ({ name: '', address: '', phone: '', str_number: '', ntn: '', province: 'punjab', city: '', is_active: true, ntn_verified: false })

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50'
const lbl = 'block text-xs font-semibold text-gray-600 mb-1'

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(emptyForm())
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // NTN/STR lookup state
  const [ntnLooking, setNtnLooking] = useState(false)
  const [strLooking, setStrLooking] = useState(false)
  const [lookupMsg, setLookupMsg]   = useState({ text: '', type: '' })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('customers/')
      setCustomers(res.data?.results ?? res.data ?? [])
    } catch { setCustomers([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || (c.ntn || '').toLowerCase().includes(q) || (c.str_number || '').toLowerCase().includes(q)
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setError(''); setLookupMsg({ text: '', type: '' }); setShowModal(true) }
  const openEdit = c => {
    setEditing(c)
    setForm({ name: c.name || '', address: c.address || '', phone: c.phone || '', str_number: c.str_number || '', ntn: c.ntn || '', province: c.province || 'punjab', city: c.city || '', is_active: c.is_active ?? true, ntn_verified: c.ntn_verified ?? false })
    setError(''); setLookupMsg({ text: '', type: '' }); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm()); setError('') }

  // ── NTN Lookup ──
  const handleNtnLookup = async () => {
    if (!form.ntn.trim()) { setLookupMsg({ text: 'Enter NTN first.', type: 'error' }); return }
    setNtnLooking(true); setLookupMsg({ text: '', type: '' })
    try {
      const res = await api.get(`/verify/ntn/?ntn=${encodeURIComponent(form.ntn.trim())}`)
      const d = res.data
      if (d.found) {
        setForm(f => ({
          ...f,
          name:         d.name     || f.name,
          address:      d.address  || f.address,
          city:         d.city     || f.city,
          province:     d.province || f.province,
          str_number:   d.str_number || f.str_number,
          ntn:          d.ntn || f.ntn,
          ntn_verified: d.verified ?? false,
        }))
        setLookupMsg({ text: d.verified ? '✓ NTN verified with FBR — details auto-filled.' : (d.note || 'NTN found. Verify remaining fields.'), type: d.verified ? 'success' : 'warn' })
      } else {
        setLookupMsg({ text: d.error || 'NTN not found on FBR. Fill details manually.', type: 'error' })
      }
    } catch { setLookupMsg({ text: 'Lookup failed. Fill details manually.', type: 'error' }) }
    setNtnLooking(false)
  }

  // ── STR Lookup ──
  const handleStrLookup = async () => {
    if (!form.str_number.trim()) { setLookupMsg({ text: 'Enter STR# first.', type: 'error' }); return }
    setStrLooking(true); setLookupMsg({ text: '', type: '' })
    try {
      const res = await api.get(`/verify/str/?str=${encodeURIComponent(form.str_number.trim())}`)
      const d = res.data
      if (d.found) {
        setForm(f => ({
          ...f,
          name:       d.name     || f.name,
          address:    d.address  || f.address,
          city:       d.city     || f.city,
          province:   d.province || f.province,
          ntn:        d.ntn      || f.ntn,
          ntn_verified: d.verified ?? false,
        }))
        const auth = PROVINCE_MAP[d.province]?.authority || 'FBR'
        setLookupMsg({ text: d.verified ? `✓ STR# verified — Province: ${PROVINCE_MAP[d.province]?.label} (${auth})` : (d.note || `Province detected: ${PROVINCE_MAP[d.province]?.label} (${auth})`), type: d.verified ? 'success' : 'warn' })
      } else {
        setLookupMsg({ text: d.error || 'STR# not found. Fill details manually.', type: 'error' })
      }
    } catch { setLookupMsg({ text: 'Lookup failed. Fill details manually.', type: 'error' }) }
    setStrLooking(false)
  }

  // Auto-detect province from STR# prefix when typed
  const handleStrChange = v => {
    set('str_number', v)
    const prefix = v.replace(/-/g, '').slice(0, 2)
    const provinceFromStr = { '01':'federal','02':'federal','03':'federal','04':'punjab','05':'sindh','06':'kpk','07':'balochistan' }[prefix]
    if (provinceFromStr) set('province', provinceFromStr)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (editing) {
        await api.patch(`customers/${editing.id}/`, payload)
      } else {
        await api.post('customers/', payload)
      }
      await fetchCustomers()
      closeModal()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to save.')
    }
    setSaving(false)
  }

  const handleDelete = async c => {
    if (!window.confirm(`Delete "${c.name}"?`)) return
    try { await api.delete(`customers/${c.id}/`); await fetchCustomers() }
    catch { alert('Failed to delete.') }
  }

  const msgColors = { success: 'bg-emerald-50 border-emerald-200 text-emerald-700', warn: 'bg-amber-50 border-amber-200 text-amber-700', error: 'bg-red-50 border-red-200 text-red-600' }
  const selectedProvince = PROVINCE_MAP[form.province]

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9]">

        {/* Hero */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10"
          style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#059669 0%,transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Sales</p>
              <h1 className="text-3xl font-bold text-white mb-1">Customers</h1>
              <p className="text-white/50 text-sm">FBR-verified customer records with province tracking</p>
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg mt-1"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Customer
            </button>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Customers', val: customers.length },
              { label: 'Active',          val: customers.filter(c => c.is_active).length },
              { label: 'NTN Verified',    val: customers.filter(c => c.ntn_verified).length },
              { label: 'Unverified',      val: customers.filter(c => !c.ntn_verified && c.ntn).length },
            ].map((s, i) => (
              <div key={s.label} className="rounded-2xl p-5 animate-fadeIn"
                style={{ animationDelay: `${i*80}ms`, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className="text-white/50 text-xs font-medium mb-2">{s.label}</p>
                <p className="text-3xl font-bold text-white">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Search */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
              <input className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                placeholder="Search name, phone, NTN, STR#…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading customers…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3 text-2xl">👥</div>
                <p className="text-gray-500 font-semibold">{search ? 'No customers match' : 'No customers yet'}</p>
                {!search && <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ Add First Customer</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Name', 'Phone', 'NTN#', 'STR#', 'Province / Authority', 'Status', 'Verified', 'Actions'].map(h => (
                        <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(c => {
                      const prov = PROVINCE_MAP[c.province]
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{c.name}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.phone || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{c.ntn || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{c.str_number || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {prov ? (
                              <div>
                                <p className="text-xs font-semibold text-gray-700">{prov.label}</p>
                                <p className="text-xs text-violet-500">{prov.authority}</p>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                              {c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {c.ntn_verified
                              ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">✓ FBR Verified</span>
                              : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Unverified</span>
                            }
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">Edit</button>
                              <button onClick={() => handleDelete(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl">×</button>
            </div>

            <div className="p-6 space-y-5">
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

              {/* NTN/STR Lookup Section */}
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔍</span>
                  <p className="text-sm font-bold text-violet-800">Auto-fill from FBR</p>
                  <span className="text-xs text-violet-500 ml-1">— prevents wrong province / name errors</span>
                </div>

                {/* NTN Lookup */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-violet-700 mb-1">NTN# <span className="text-violet-400">(National Tax Number)</span></label>
                    <input className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      placeholder="e.g. 1234567-8" value={form.ntn}
                      onChange={e => set('ntn', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNtnLookup()} />
                  </div>
                  <button onClick={handleNtnLookup} disabled={ntnLooking}
                    className="px-4 py-2 mt-5 rounded-xl text-xs font-bold text-white disabled:opacity-60 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {ntnLooking ? '…' : 'Verify NTN'}
                  </button>
                </div>

                {/* STR Lookup */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-violet-700 mb-1">STR# <span className="text-violet-400">(Sales Tax Reg. Number)</span></label>
                    <input className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white font-mono"
                      placeholder="e.g. 04-05-3200-009-46" value={form.str_number}
                      onChange={e => handleStrChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStrLookup()} />
                  </div>
                  <button onClick={handleStrLookup} disabled={strLooking}
                    className="px-4 py-2 mt-5 rounded-xl text-xs font-bold text-white disabled:opacity-60 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}>
                    {strLooking ? '…' : 'Verify STR#'}
                  </button>
                </div>

                {lookupMsg.text && (
                  <div className={`rounded-xl px-3 py-2.5 text-xs border ${msgColors[lookupMsg.type]}`}>
                    {lookupMsg.text}
                  </div>
                )}

                {form.ntn_verified && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">✓</span>
                    FBR Verified — data auto-filled from FBR records
                  </div>
                )}
              </div>

              {/* Province — always a dropdown, never free text */}
              <div>
                <label className={lbl}>
                  Province / Tax Authority <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(auto-set from STR# prefix)</span>
                </label>
                <select className={inp} value={form.province} onChange={e => set('province', e.target.value)}>
                  {PROVINCES.map(p => (
                    <option key={p.value} value={p.value}>{p.label} — {p.authority}</option>
                  ))}
                </select>
                {selectedProvince && (
                  <p className="text-xs text-violet-600 mt-1 font-medium">
                    Tax invoices for this customer go to <strong>{selectedProvince.authority}</strong>
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className={lbl}>Business Name <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="Registered business name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              {/* Address + City */}
              <div>
                <label className={lbl}>Registered Address</label>
                <textarea className={inp + ' resize-none'} rows={2} placeholder="Street, area…" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>City</label>
                  <input className={inp} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => set('is_active', !form.is_active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {saving ? 'Saving…' : editing ? 'Update Customer' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
