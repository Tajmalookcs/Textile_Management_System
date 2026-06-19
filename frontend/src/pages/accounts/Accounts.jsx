import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense']
const TYPE_LABELS   = { asset: 'Asset', liability: 'Liability', equity: 'Equity', income: 'Income', expense: 'Expense' }
const TYPE_COLORS   = {
  asset:     'bg-blue-50 text-blue-700',
  liability: 'bg-red-50 text-red-600',
  equity:    'bg-violet-50 text-violet-700',
  income:    'bg-emerald-50 text-emerald-700',
  expense:   'bg-amber-50 text-amber-700',
}
const TYPE_GRADIENTS = {
  asset:     'linear-gradient(135deg,#3b82f6,#4f46e5)',
  liability: 'linear-gradient(135deg,#dc2626,#ea580c)',
  equity:    'linear-gradient(135deg,#7c3aed,#9333ea)',
  income:    'linear-gradient(135deg,#059669,#0d9488)',
  expense:   'linear-gradient(135deg,#d97706,#ea580c)',
}

const today = () => new Date().toISOString().split('T')[0]
const fmtMoney = n => 'Rs ' + (Number(n) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50'
const lbl = 'block text-xs font-semibold text-gray-600 mb-1'

export default function Accounts() {
  const [tab, setTab]             = useState('accounts')   // 'accounts' | 'ledger'
  const [accounts, setAccounts]   = useState([])
  const [ledger, setLedger]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAccModal, setShowAccModal] = useState(false)
  const [showLedModal, setShowLedModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [filterType, setFilterType] = useState('all')

  // account form
  const [accName, setAccName]     = useState('')
  const [accType, setAccType]     = useState('asset')
  const [accParent, setAccParent] = useState('')
  const [accActive, setAccActive] = useState(true)

  // ledger form
  const [ledAccount, setLedAccount]   = useState('')
  const [ledType, setLedType]         = useState('debit')
  const [ledAmount, setLedAmount]     = useState('')
  const [ledDesc, setLedDesc]         = useState('')
  const [ledRef, setLedRef]           = useState('')
  const [ledDate, setLedDate]         = useState(today())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [accR, ledR] = await Promise.all([api.get('accounts/'), api.get('ledger/')])
      setAccounts(accR.data?.results ?? accR.data ?? [])
      setLedger(ledR.data?.results   ?? ledR.data ?? [])
    } catch { setAccounts([]); setLedger([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Account save ──
  const handleSaveAccount = async () => {
    if (!accName.trim()) { setError('Account name is required.'); return }
    setSaving(true); setError('')
    try {
      await api.post('accounts/', { name: accName.trim(), account_type: accType, parent: accParent || null, is_active: accActive })
      await fetchAll()
      setShowAccModal(false)
    } catch (e) { setError(e?.response?.data?.detail || 'Failed to create account.') }
    setSaving(false)
  }

  // ── Ledger save ──
  const handleSaveLedger = async () => {
    if (!ledAccount) { setError('Select an account.'); return }
    if (!ledAmount || Number(ledAmount) <= 0) { setError('Enter a valid amount.'); return }
    if (!ledDesc.trim()) { setError('Description is required.'); return }
    if (!ledDate) { setError('Date is required.'); return }
    setSaving(true); setError('')
    try {
      await api.post('ledger/', { account: ledAccount, entry_type: ledType, amount: parseFloat(ledAmount), description: ledDesc.trim(), reference: ledRef, date: ledDate })
      await fetchAll()
      setShowLedModal(false)
    } catch (e) { setError(e?.response?.data?.detail || 'Failed to save entry.') }
    setSaving(false)
  }

  const openAccModal = () => { setAccName(''); setAccType('asset'); setAccParent(''); setAccActive(true); setError(''); setShowAccModal(true) }
  const openLedModal = () => { setLedAccount(''); setLedType('debit'); setLedAmount(''); setLedDesc(''); setLedRef(''); setLedDate(today()); setError(''); setShowLedModal(true) }

  // ── Derived stats ──
  const typeTotals = {}
  ACCOUNT_TYPES.forEach(t => { typeTotals[t] = accounts.filter(a => a.account_type === t && a.is_active).length })

  const totalDebits  = ledger.filter(e => e.entry_type === 'debit').reduce((s, e)  => s + Number(e.amount), 0)
  const totalCredits = ledger.filter(e => e.entry_type === 'credit').reduce((s, e) => s + Number(e.amount), 0)

  const filteredAccounts = filterType === 'all' ? accounts : accounts.filter(a => a.account_type === filterType)

  const accountName = id => accounts.find(a => a.id === Number(id))?.name || `#${id}`

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9]">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10"
          style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#059669 0%,transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />

          <div className="relative z-10 flex items-start justify-between mb-8">
            <div>
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Finance</p>
              <h1 className="text-3xl font-bold text-white mb-1">Accounts & Ledger</h1>
              <p className="text-white/50 text-sm">Chart of accounts and double-entry bookkeeping</p>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={openLedModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-white/20 hover:bg-white/10 transition-all">
                + Entry
              </button>
              <button onClick={openAccModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                + Account
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Accounts', value: accounts.length, sub: `${accounts.filter(a=>a.is_active).length} active`, gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)', shadow: 'rgba(124,58,237,0.35)' },
              { label: 'Ledger Entries', value: ledger.length,   sub: 'all time',                                          gradient: 'linear-gradient(135deg,#d97706,#ea580c)', shadow: 'rgba(217,119,6,0.35)' },
              { label: 'Total Debits',   value: fmtMoney(totalDebits),  sub: 'sum of debit entries',                       gradient: 'linear-gradient(135deg,#dc2626,#ea580c)', shadow: 'rgba(220,38,38,0.35)' },
              { label: 'Total Credits',  value: fmtMoney(totalCredits), sub: 'sum of credit entries',                      gradient: 'linear-gradient(135deg,#059669,#0d9488)', shadow: 'rgba(5,150,105,0.35)' },
            ].map((s, i) => (
              <div key={s.label} className="rounded-2xl p-5 card-hover animate-fadeIn"
                style={{ animationDelay: `${i*80}ms`, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-white/60 text-xs font-medium">{s.label}</p>
                  <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{loading ? '—' : s.value}</p>
                <p className="text-white/35 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit mb-6">
            {[['accounts', 'Chart of Accounts'], ['ledger', 'Ledger Entries']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                style={tab === key ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                {label}
              </button>
            ))}
          </div>

          {/* ══ ACCOUNTS TAB ══ */}
          {tab === 'accounts' && (
            <div className="space-y-5">
              {/* Type filter */}
              <div className="flex gap-2 flex-wrap">
                {['all', ...ACCOUNT_TYPES].map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === t ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-200 hover:border-violet-300'}`}
                    style={filterType === t ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                    {t === 'all' ? `All (${accounts.length})` : `${TYPE_LABELS[t]} (${typeTotals[t]})`}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Loading accounts…
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3 text-2xl">📊</div>
                    <p className="text-gray-500 font-semibold">No accounts yet</p>
                    <button onClick={openAccModal} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ Create Account</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Account Name', 'Type', 'Parent', 'Status'].map(h => (
                            <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAccounts.map(a => (
                          <tr key={a.id} className={`hover:bg-gray-50/60 transition-colors ${!a.is_active ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {a.parent && <span className="text-gray-300 mr-2">└</span>}
                              {a.name}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[a.account_type] || 'bg-gray-100 text-gray-600'}`}>
                                {TYPE_LABELS[a.account_type]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {a.parent ? accountName(a.parent) : <span className="text-gray-300 italic">Root</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${a.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                {a.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ LEDGER TAB ══ */}
          {tab === 'ledger' && (
            <div className="space-y-5">
              {/* Summary pills */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-500">Total Debits</span>
                  <span className="text-sm font-bold text-gray-900">{fmtMoney(totalDebits)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">Total Credits</span>
                  <span className="text-sm font-bold text-gray-900">{fmtMoney(totalCredits)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
                  <span className="text-xs text-gray-500">Balance</span>
                  <span className={`text-sm font-bold ${totalDebits - totalCredits >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {fmtMoney(Math.abs(totalDebits - totalCredits))}
                    <span className="text-xs font-normal text-gray-400 ml-1">{totalDebits >= totalCredits ? 'DR' : 'CR'}</span>
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Loading entries…
                  </div>
                ) : ledger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-2xl">📒</div>
                    <p className="text-gray-500 font-semibold">No ledger entries yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create accounts first, then add entries.</p>
                    <button onClick={openLedModal} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ New Entry</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Date', 'Account', 'Description', 'Reference', 'Type', 'Amount'].map(h => (
                            <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ledger.map(e => (
                          <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{e.date}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{e.account_name || accountName(e.account)}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{e.description}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{e.reference || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${e.entry_type === 'debit' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                {e.entry_type === 'debit' ? 'DR' : 'CR'}
                              </span>
                            </td>
                            <td className={`px-4 py-3 font-semibold tabular-nums whitespace-nowrap ${e.entry_type === 'debit' ? 'text-red-600' : 'text-emerald-600'}`}>
                              {fmtMoney(e.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New Account Modal ── */}
      {showAccModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">New Account</h3>
              <button onClick={() => setShowAccModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
              <div>
                <label className={lbl}>Account Name <span className="text-red-500">*</span></label>
                <input className={inp} value={accName} onChange={e => setAccName(e.target.value)} placeholder="e.g. Cash & Bank, Trade Receivables" />
              </div>
              <div>
                <label className={lbl}>Account Type <span className="text-red-500">*</span></label>
                <select className={inp} value={accType} onChange={e => setAccType(e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Parent Account <span className="text-gray-400">(optional)</span></label>
                <select className={inp} value={accParent} onChange={e => setAccParent(e.target.value)}>
                  <option value="">None (root account)</option>
                  {accounts.filter(a => a.account_type === accType && a.is_active).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAccActive(!accActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${accActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${accActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowAccModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveAccount} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {saving ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Ledger Entry Modal ── */}
      {showLedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">New Ledger Entry</h3>
              <button onClick={() => setShowLedModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
              {accounts.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-xl px-4 py-3">
                  No accounts found. Create accounts first before adding ledger entries.
                </div>
              )}
              <div>
                <label className={lbl}>Account <span className="text-red-500">*</span></label>
                <select className={inp} value={ledAccount} onChange={e => setLedAccount(e.target.value)}>
                  <option value="">Select account…</option>
                  {accounts.filter(a => a.is_active).map(a => (
                    <option key={a.id} value={a.id}>[{TYPE_LABELS[a.account_type]}] {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Entry Type <span className="text-red-500">*</span></label>
                  <select className={inp} value={ledType} onChange={e => setLedType(e.target.value)}>
                    <option value="debit">Debit (DR)</option>
                    <option value="credit">Credit (CR)</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Amount <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" className={inp} value={ledAmount} onChange={e => setLedAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className={lbl}>Description <span className="text-red-500">*</span></label>
                <input className={inp} value={ledDesc} onChange={e => setLedDesc(e.target.value)} placeholder="Brief description of this entry" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Reference <span className="text-gray-400">(optional)</span></label>
                  <input className={inp} value={ledRef} onChange={e => setLedRef(e.target.value)} placeholder="Invoice #, PO #, etc." />
                </div>
                <div>
                  <label className={lbl}>Date <span className="text-red-500">*</span></label>
                  <input type="date" className={inp} value={ledDate} onChange={e => setLedDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowLedModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveLedger} disabled={saving || accounts.length === 0}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
