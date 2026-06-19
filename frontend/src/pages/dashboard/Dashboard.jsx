import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const fmtMoney = n => 'Rs ' + (Number(n) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const todayISO = () => new Date().toISOString().split('T')[0]

const statusStyles = {
  draft:     { cls: 'bg-gray-100 text-gray-600',        label: 'Draft' },
  issued:    { cls: 'bg-blue-50 text-blue-700',         label: 'Issued' },
  paid:      { cls: 'bg-emerald-50 text-emerald-700',   label: 'Paid' },
  cancelled: { cls: 'bg-red-50 text-red-600',           label: 'Cancelled' },
}

const actions = [
  { label: 'New Invoice',  path: '/invoices/new', gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
  { label: 'Add Product',  path: '/products',     gradient: 'linear-gradient(135deg,#059669,#0d9488)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { label: 'Stock Entry',  path: '/inventory',    gradient: 'linear-gradient(135deg,#d97706,#ea580c)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { label: 'New Purchase', path: '/purchases',    gradient: 'linear-gradient(135deg,#db2777,#9333ea)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
]

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  // live data
  const [products, setProducts]         = useState([])
  const [todayInvoices, setTodayInv]    = useState([])
  const [pendingInvoices, setPending]   = useState([])
  const [recentInvoices, setRecent]     = useState([])
  const [lowStock, setLowStock]         = useState([])
  const [company, setCompany]           = useState(null)
  const [batches, setBatches]           = useState([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const today = todayISO()
      const [prodR, invR, stockR, compR, batchR] = await Promise.all([
        api.get('products/'),
        api.get('invoices/'),
        api.get('stock/'),
        api.get('company/').catch(() => ({ data: [] })),
        api.get('batches/'),
      ])

      const allProducts = prodR.data?.results ?? prodR.data ?? []
      const allInvoices = invR.data?.results  ?? invR.data  ?? []
      const allStock    = stockR.data?.results ?? stockR.data ?? []
      const allBatches  = batchR.data?.results ?? batchR.data ?? []
      const compData    = compR.data

      setProducts(allProducts)
      setBatches(allBatches)

      const compObj = compData?.results?.[0] || compData?.[0] || (Array.isArray(compData) ? compData[0] : compData) || null
      setCompany(compObj)

      // Today's invoices
      const todayInv = allInvoices.filter(i => i.date === today)
      setTodayInv(todayInv)

      // Pending (draft + issued)
      setPending(allInvoices.filter(i => i.status === 'draft' || i.status === 'issued'))

      // Recent 10
      setRecent([...allInvoices].sort((a, b) => b.id - a.id).slice(0, 10))

      // Low stock: quantity <= 10 (simple threshold, adjust as needed)
      const LOW_THRESHOLD = 10
      setLowStock(allStock.filter(s => Number(s.quantity) <= LOW_THRESHOLD && Number(s.quantity) >= 0))

    } catch (e) {
      console.error('Dashboard fetch error', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const todaySalesTotal = todayInvoices.reduce((s, i) => s + (Number(i.total_value_incl_tax) || 0), 0)
  const activeProducts  = products.filter(p => p.is_active).length
  const inProgressBatches = batches.filter(b => b.status === 'in_progress').length

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    {
      label: 'Total Products',
      value: loading ? '—' : products.length.toString(),
      sub: loading ? '' : `${activeProducts} active`,
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>,
      gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)', shadow: 'rgba(124,58,237,0.35)', link: '/products',
    },
    {
      label: "Today's Sales",
      value: loading ? '—' : fmtMoney(todaySalesTotal),
      sub: loading ? '' : `${todayInvoices.length} invoice${todayInvoices.length !== 1 ? 's' : ''} today`,
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
      gradient: 'linear-gradient(135deg,#059669,#0d9488)', shadow: 'rgba(5,150,105,0.35)', link: '/invoices',
    },
    {
      label: 'Pending Invoices',
      value: loading ? '—' : pendingInvoices.length.toString(),
      sub: loading ? '' : `${pendingInvoices.filter(i => i.status === 'issued').length} issued, ${pendingInvoices.filter(i => i.status === 'draft').length} draft`,
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      gradient: 'linear-gradient(135deg,#d97706,#ea580c)', shadow: 'rgba(217,119,6,0.35)', link: '/invoices',
    },
    {
      label: 'Low Stock Items',
      value: loading ? '—' : lowStock.length.toString(),
      sub: loading ? '' : lowStock.length === 0 ? 'All stock normal' : `${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} need restocking`,
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
      gradient: 'linear-gradient(135deg,#db2777,#9333ea)', shadow: 'rgba(219,39,119,0.35)', link: '/inventory',
    },
  ]

  return (
    <Layout>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden px-8 pt-8 pb-10"
        style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#4f46e5 0%,transparent 50%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />

        <div className="relative z-10 animate-fadeIn flex items-start justify-between">
          <div>
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Overview</p>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-white/50 text-sm">
              {greeting}{user?.first_name ? `, ${user.first_name}` : user?.username ? `, ${user.username}` : ''}. Here's your mill at a glance.
            </p>
          </div>
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all mt-1">
            {loading ? <Spinner /> : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            )}
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {stats.map((s, i) => (
            <Link to={s.link} key={s.label}
              className="rounded-2xl p-5 card-hover animate-fadeIn block"
              style={{ animationDelay: `${i * 80}ms`, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-white/60 text-xs font-medium leading-tight">{s.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {loading ? <span className="inline-block w-12 h-8 bg-white/10 rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-white/35 text-xs">{loading ? '' : s.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-6 animate-fadeIn">

        {/* Active batches banner — only show if any in progress */}
        {!loading && inProgressBatches > 0 && (
          <Link to="/production"
            className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3.5 mb-6 hover:bg-blue-100 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">{inProgressBatches} production batch{inProgressBatches !== 1 ? 'es' : ''} in progress</p>
              <p className="text-xs text-blue-500">Click to view production status →</p>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map(a => (
              <Link key={a.label} to={a.path}
                className="group relative rounded-2xl p-4 overflow-hidden card-hover"
                style={{ background: a.gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="relative flex items-center gap-3 text-white">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    {a.icon}
                  </div>
                  <span className="font-semibold text-sm">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Invoices */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Recent Invoices</h3>
                <p className="text-gray-400 text-xs mt-0.5">Last 10 sales tax invoices</p>
              </div>
              <Link to="/invoices" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">View all →</Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-24 h-4 bg-gray-100 rounded" />
                    <div className="flex-1 h-4 bg-gray-100 rounded" />
                    <div className="w-16 h-4 bg-gray-100 rounded" />
                    <div className="w-20 h-6 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-400">No invoices yet</p>
                <p className="text-xs text-gray-300 mt-1">Create your first sales tax invoice</p>
                <Link to="/invoices/new"
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  + New Invoice
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Invoice #', 'Customer', 'Date', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentInvoices.map(inv => {
                      const st = statusStyles[inv.status] || statusStyles.draft
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap text-xs">
                            {inv.invoice_no || inv.invoice_number}
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs max-w-[120px] truncate">{inv.customer_name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inv.date}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold text-xs whitespace-nowrap tabular-nums">
                            {fmtMoney(inv.total_value_incl_tax)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Stock Alerts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Stock Alerts</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Items ≤ 10 units</p>
                </div>
                <Link to="/inventory" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">View all →</Link>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="flex-1 h-4 bg-gray-100 rounded" />
                      <div className="w-12 h-4 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2">
                    <svg width="20" height="20" fill="none" stroke="#059669" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-400">All stock normal</p>
                  <p className="text-xs text-gray-300 mt-1">No items running low</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {lowStock.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.product_name || `Product #${s.product}`}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.warehouse_name || `Warehouse #${s.warehouse}`}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className={`text-xs font-bold tabular-nums ${Number(s.quantity) === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {Number(s.quantity).toLocaleString()} {s.unit || ''}
                        </span>
                        {Number(s.quantity) === 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                  {lowStock.length > 6 && (
                    <div className="px-5 py-2.5">
                      <p className="text-xs text-gray-400">+{lowStock.length - 6} more items low</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Company / FBR card */}
            <div className="rounded-2xl p-5 overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />
              {company ? (
                <>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Company</p>
                  <p className="text-white font-bold text-sm mb-0.5 truncate">{company.name}</p>
                  {company.str_number && <p className="text-white/40 text-xs mb-0.5">STR# {company.str_number}</p>}
                  {company.ntn_number && <p className="text-white/40 text-xs mb-3">NTN# {company.ntn_number}</p>}
                  <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors">
                    Edit settings →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">FBR Integration</p>
                  <p className="text-white font-bold text-sm mb-1">Not Configured</p>
                  <p className="text-white/40 text-xs mb-4">Set up company info for FBR-compliant invoicing</p>
                  <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors">
                    Configure now →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary row — month stats */}
        {!loading && (recentInvoices.length > 0 || products.length > 0) && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Invoices',    val: recentInvoices.length > 0 ? '...' : '0', link: '/invoices' },
              { label: 'Active Customers',  val: '...', link: '/customers' },
              { label: 'In-Progress Batches', val: inProgressBatches, link: '/production' },
              { label: 'Active Products',   val: activeProducts, link: '/products' },
            ].map(r => (
              <Link key={r.label} to={r.link}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">{r.label}</p>
                <p className="text-xl font-bold text-gray-900">{r.val}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
