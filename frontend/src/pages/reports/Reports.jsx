import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const fmt = (n, dec = 0) =>
  n == null || isNaN(Number(n)) ? '0' : Number(n).toLocaleString('en-PK', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtMoney = n => 'Rs ' + fmt(n, 0)

const monthName = m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || m

function StatCard({ label, value, sub, gradient, shadow, icon }) {
  return (
    <div className="rounded-2xl p-5 card-hover animate-fadeIn"
      style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-white/60 text-xs font-medium leading-tight">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 12px ${shadow}` }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {sub && <p className="text-white/35 text-xs">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-gray-600 w-28 truncate shrink-0">{label}</p>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs font-semibold text-gray-700 w-16 text-right tabular-nums">{fmtMoney(value)}</p>
    </div>
  )
}

const TABS = ['Sales', 'Purchases', 'Inventory', 'Production']

export default function Reports() {
  const [tab, setTab]           = useState('Sales')
  const [loading, setLoading]   = useState(true)

  // data
  const [invoices, setInvoices]   = useState([])
  const [purchases, setPurchases] = useState([])
  const [stock, setStock]         = useState([])
  const [batches, setBatches]     = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts]   = useState([])

  // filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [invR, poR, stR, batR, cusR, supR, proR] = await Promise.all([
        api.get('invoices/'),
        api.get('purchase-orders/'),
        api.get('stock/'),
        api.get('batches/'),
        api.get('customers/'),
        api.get('suppliers/'),
        api.get('products/'),
      ])
      setInvoices(invR.data?.results   ?? invR.data   ?? [])
      setPurchases(poR.data?.results   ?? poR.data    ?? [])
      setStock(stR.data?.results       ?? stR.data    ?? [])
      setBatches(batR.data?.results    ?? batR.data   ?? [])
      setCustomers(cusR.data?.results  ?? cusR.data   ?? [])
      setSuppliers(supR.data?.results  ?? supR.data   ?? [])
      setProducts(proR.data?.results   ?? proR.data   ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── derived sales data ──
  const filteredInv = invoices.filter(inv => {
    const d = inv.date
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)
  })

  const totalSales     = filteredInv.reduce((s, i) => s + (Number(i.total_value_incl_tax) || 0), 0)
  const totalSalesExcl = filteredInv.reduce((s, i) => s + (Number(i.total_value_excl_tax) || 0), 0)
  const totalTax       = filteredInv.reduce((s, i) => s + (Number(i.total_sales_tax) || 0), 0)
  const paidInvoices   = filteredInv.filter(i => i.status === 'paid')
  const totalPaid      = paidInvoices.reduce((s, i) => s + (Number(i.total_value_incl_tax) || 0), 0)

  // top customers by revenue
  const custMap = {}
  filteredInv.forEach(inv => {
    const k = inv.customer_name || inv.customer
    if (!k) return
    custMap[k] = (custMap[k] || 0) + (Number(inv.total_value_incl_tax) || 0)
  })
  const topCustomers = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCust = topCustomers[0]?.[1] || 1

  // sales by month
  const monthMap = {}
  filteredInv.forEach(inv => {
    if (!inv.date) return
    const [y, m] = inv.date.split('-')
    const key = `${y}-${m}`
    monthMap[key] = (monthMap[key] || 0) + (Number(inv.total_value_incl_tax) || 0)
  })
  const monthlyData = Object.entries(monthMap).sort().map(([k, v]) => ({ label: `${monthName(parseInt(k.split('-')[1]))} ${k.split('-')[0]}`, value: v }))
  const maxMonth = Math.max(...monthlyData.map(m => m.value), 1)

  // status breakdown
  const statusCount = { draft: 0, issued: 0, paid: 0, cancelled: 0 }
  filteredInv.forEach(i => { if (statusCount[i.status] !== undefined) statusCount[i.status]++ })

  // ── purchase data ──
  const totalPO    = purchases.reduce((s, p) => s + (Number(p.total_incl_tax) || 0), 0)
  const receivedPO = purchases.filter(p => p.status === 'received').length

  // ── inventory data ──
  const totalStockItems = stock.length
  const totalStockValue = stock.reduce((s, r) => {
    const prod = products.find(p => p.id === (r.product?.id || r.product))
    const price = Number(prod?.wholesale_price || prod?.retail_price || 0)
    return s + price * Number(r.quantity || 0)
  }, 0)

  // ── production data ──
  const batchStatus = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
  batches.forEach(b => { if (batchStatus[b.status] !== undefined) batchStatus[b.status]++ })

  const processMap = {}
  batches.forEach(b => { processMap[b.process_type] = (processMap[b.process_type] || 0) + 1 })
  const processList = Object.entries(processMap).sort((a, b) => b[1] - a[1])

  const inp = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white'

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

          <div className="relative z-10 mb-6">
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Analytics</p>
            <h1 className="text-3xl font-bold text-white mb-1">Reports</h1>
            <p className="text-white/50 text-sm">Business performance at a glance</p>
          </div>

          {/* Summary KPIs */}
          <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Sales (Period)" value={fmtMoney(totalSales)} sub={`${filteredInv.length} invoices`}
              gradient="linear-gradient(135deg,#059669,#0d9488)" shadow="rgba(5,150,105,0.35)"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
            <StatCard label="Sales Tax Collected" value={fmtMoney(totalTax)} sub={`on ${fmtMoney(totalSalesExcl)} excl.`}
              gradient="linear-gradient(135deg,#7c3aed,#4f46e5)" shadow="rgba(124,58,237,0.35)"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 14l6-6M10 9h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
            <StatCard label="Total Purchases" value={fmtMoney(totalPO)} sub={`${receivedPO} received`}
              gradient="linear-gradient(135deg,#d97706,#ea580c)" shadow="rgba(217,119,6,0.35)"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>} />
            <StatCard label="Stock Items" value={fmt(totalStockItems)} sub={`Est. ${fmtMoney(totalStockValue)} value`}
              gradient="linear-gradient(135deg,#db2777,#9333ea)" shadow="rgba(219,39,119,0.35)"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>} />
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Date filter + tab bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                  {t}
                </button>
              ))}
            </div>
            {(tab === 'Sales' || tab === 'Purchases') && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 text-xs font-medium">Period:</span>
                <input type="date" className={inp} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <span className="text-gray-400">—</span>
                <input type="date" className={inp} value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32 text-gray-400">
              <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading report data…
            </div>
          ) : (
            <>
              {/* ══ SALES TAB ══ */}
              {tab === 'Sales' && (
                <div className="space-y-6">
                  {/* Invoice status breakdown */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Draft',     count: statusCount.draft,     cls: 'bg-gray-50 text-gray-700',       bar: '#9ca3af' },
                      { label: 'Issued',    count: statusCount.issued,    cls: 'bg-blue-50 text-blue-700',       bar: '#4f46e5' },
                      { label: 'Paid',      count: statusCount.paid,      cls: 'bg-emerald-50 text-emerald-700', bar: '#059669' },
                      { label: 'Cancelled', count: statusCount.cancelled, cls: 'bg-red-50 text-red-600',         bar: '#dc2626' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl p-5 ${s.cls} border border-white/50`}>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{s.label}</p>
                        <p className="text-3xl font-bold">{s.count}</p>
                        <p className="text-xs opacity-50 mt-1">invoices</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by month */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">Revenue by Month</h3>
                      <p className="text-xs text-gray-400 mb-5">Value incl. sales tax</p>
                      {monthlyData.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-6 text-center">No data in selected period.</p>
                      ) : (
                        <div className="space-y-3">
                          {monthlyData.map(m => (
                            <div key={m.label} className="flex items-center gap-3">
                              <p className="text-xs text-gray-500 w-20 shrink-0">{m.label}</p>
                              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all duration-700"
                                  style={{ width: `${Math.round((m.value / maxMonth) * 100)}%`, background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }} />
                              </div>
                              <p className="text-xs font-semibold text-gray-700 w-20 text-right tabular-nums">{fmtMoney(m.value)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top customers */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">Top Customers</h3>
                      <p className="text-xs text-gray-400 mb-5">By revenue in period</p>
                      {topCustomers.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-6 text-center">No customer data.</p>
                      ) : (
                        <div className="space-y-3">
                          {topCustomers.map(([name, val]) => (
                            <MiniBar key={name} label={name} value={val} max={maxCust} color="linear-gradient(90deg,#059669,#0d9488)" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice table */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">Invoice Detail</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{filteredInv.length} invoices in period</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-400 text-xs">Total (incl. tax)</p>
                        <p className="font-bold text-gray-900">{fmtMoney(totalSales)}</p>
                      </div>
                    </div>
                    {filteredInv.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-sm">No invoices in selected period.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              {['Invoice #','Customer','Date','Status','Excl. Tax','Tax','Incl. Tax'].map(h => (
                                <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredInv.slice(0, 50).map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{inv.invoice_no || inv.invoice_number}</td>
                                <td className="px-4 py-3 text-gray-700">{inv.customer_name}</td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{inv.date}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                    inv.status === 'issued' ? 'bg-blue-50 text-blue-700' :
                                    inv.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{fmt(inv.total_value_excl_tax)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-500">{fmt(inv.total_sales_tax)}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{fmt(inv.total_value_incl_tax)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 font-bold border-t border-gray-200">
                              <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Grand Total</td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmt(totalSalesExcl)}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-600">{fmt(totalTax)}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-900">{fmt(totalSales)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ PURCHASES TAB ══ */}
              {tab === 'Purchases' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Draft',     count: purchases.filter(p=>p.status==='draft').length,     cls:'bg-gray-50 text-gray-700' },
                      { label: 'Confirmed', count: purchases.filter(p=>p.status==='confirmed').length, cls:'bg-blue-50 text-blue-700' },
                      { label: 'Received',  count: purchases.filter(p=>p.status==='received').length,  cls:'bg-emerald-50 text-emerald-700' },
                      { label: 'Cancelled', count: purchases.filter(p=>p.status==='cancelled').length, cls:'bg-red-50 text-red-600' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl p-5 ${s.cls}`}>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{s.label}</p>
                        <p className="text-3xl font-bold">{s.count}</p>
                        <p className="text-xs opacity-50 mt-1">orders</p>
                      </div>
                    ))}
                  </div>

                  {/* Top suppliers */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">Top Suppliers</h3>
                      <p className="text-xs text-gray-400 mb-5">By purchase value</p>
                      {(() => {
                        const supMap = {}
                        purchases.forEach(po => {
                          const k = typeof po.supplier === 'object' ? po.supplier?.name : (suppliers.find(s=>s.id===po.supplier)?.name || `#${po.supplier}`)
                          if (k) supMap[k] = (supMap[k] || 0) + (Number(po.total_incl_tax) || 0)
                        })
                        const top = Object.entries(supMap).sort((a,b)=>b[1]-a[1]).slice(0,6)
                        const maxV = top[0]?.[1] || 1
                        return top.length === 0
                          ? <p className="text-sm text-gray-400 italic py-6 text-center">No purchase data.</p>
                          : <div className="space-y-3">{top.map(([n,v]) => <MiniBar key={n} label={n} value={v} max={maxV} color="linear-gradient(90deg,#d97706,#ea580c)" />)}</div>
                      })()}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-4">Purchase Summary</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Total POs', val: purchases.length },
                          { label: 'Total Value (incl. tax)', val: fmtMoney(totalPO) },
                          { label: 'Received Orders', val: `${receivedPO} (${purchases.length ? Math.round(receivedPO/purchases.length*100) : 0}%)` },
                          { label: 'Active Suppliers', val: suppliers.filter(s=>s.is_active).length },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-500">{r.label}</span>
                            <span className="text-sm font-bold text-gray-900">{r.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                      <h3 className="font-bold text-gray-800 text-sm">Purchase Orders</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{purchases.length} total orders</p>
                    </div>
                    {purchases.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-sm">No purchase orders found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              {['PO #','Supplier','Date','Status','Total (incl. tax)'].map(h => (
                                <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {purchases.slice(0, 50).map(po => (
                              <tr key={po.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900">{po.po_number || `PO-${String(po.id).padStart(5,'0')}`}</td>
                                <td className="px-4 py-3 text-gray-700">{typeof po.supplier==='object' ? po.supplier?.name : (suppliers.find(s=>s.id===po.supplier)?.name||'—')}</td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{po.date}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    po.status==='received'?'bg-emerald-50 text-emerald-700':po.status==='confirmed'?'bg-blue-50 text-blue-700':po.status==='cancelled'?'bg-red-50 text-red-600':'bg-gray-100 text-gray-600'}`}>{po.status}</span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{fmtMoney(po.total_incl_tax)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ INVENTORY TAB ══ */}
              {tab === 'Inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">Current Stock Levels</h3>
                      <p className="text-xs text-gray-400 mb-5">All warehouses combined</p>
                      {stock.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-6 text-center">No stock records found.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                {['Product','Warehouse','Quantity','Unit','Est. Value'].map(h => (
                                  <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-left">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {stock.slice(0,50).map(r => {
                                const prod = products.find(p=>p.id===(r.product?.id||r.product))
                                const price = Number(prod?.wholesale_price||prod?.retail_price||0)
                                const val = price * Number(r.quantity||0)
                                return (
                                  <tr key={r.id} className="hover:bg-gray-50/60">
                                    <td className="px-3 py-2.5 font-medium text-gray-800">{r.product_name || prod?.name || `#${r.product}`}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{r.warehouse_name || `#${r.warehouse}`}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{Number(r.quantity).toLocaleString()}</td>
                                    <td className="px-3 py-2.5 text-gray-500">{r.unit || prod?.unit?.abbreviation || '—'}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{val>0 ? fmtMoney(val) : '—'}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 text-sm mb-4">Inventory Summary</h3>
                        {[
                          { label: 'Total Products', val: products.length },
                          { label: 'Active Products', val: products.filter(p=>p.is_active).length },
                          { label: 'Stock Records', val: stock.length },
                          { label: 'Est. Total Value', val: fmtMoney(totalStockValue) },
                        ].map(r => (
                          <div key={r.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-500">{r.label}</span>
                            <span className="text-sm font-bold text-gray-900">{r.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 text-sm mb-4">Top Customers</h3>
                        <p className="text-xs text-gray-400 mb-3">{customers.length} total customers</p>
                        {[
                          { label: 'Total Customers', val: customers.length },
                          { label: 'Active', val: customers.filter(c=>c.is_active).length },
                        ].map(r => (
                          <div key={r.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-500">{r.label}</span>
                            <span className="text-sm font-bold text-gray-900">{r.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ PRODUCTION TAB ══ */}
              {tab === 'Production' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Pending',     val: batchStatus.pending,     cls: 'bg-amber-50 text-amber-700' },
                      { label: 'In Progress', val: batchStatus.in_progress, cls: 'bg-blue-50 text-blue-700' },
                      { label: 'Completed',   val: batchStatus.completed,   cls: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Cancelled',   val: batchStatus.cancelled,   cls: 'bg-red-50 text-red-600' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl p-5 ${s.cls}`}>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{s.label}</p>
                        <p className="text-3xl font-bold">{s.val}</p>
                        <p className="text-xs opacity-50 mt-1">batches</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">Batches by Process Type</h3>
                      <p className="text-xs text-gray-400 mb-5">All time</p>
                      {processList.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-6 text-center">No batch data yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {processList.map(([type, count]) => {
                            const maxProc = processList[0]?.[1] || 1
                            return (
                              <div key={type} className="flex items-center gap-3">
                                <p className="text-xs text-gray-600 w-24 truncate shrink-0">{type}</p>
                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <div className="h-3 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.round(count/maxProc*100)}%`, background: 'linear-gradient(90deg,#d97706,#ea580c)' }} />
                                </div>
                                <p className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-4">Production Summary</h3>
                      {[
                        { label: 'Total Batches', val: batches.length },
                        { label: 'Completion Rate', val: batches.length ? `${Math.round(batchStatus.completed/batches.length*100)}%` : '—' },
                        { label: 'Avg. per Process Type', val: processList.length ? Math.round(batches.length/processList.length) : '—' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-500">{r.label}</span>
                          <span className="text-sm font-bold text-gray-900">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                      <h3 className="font-bold text-gray-800 text-sm">Recent Batches</h3>
                    </div>
                    {batches.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-sm">No batches created yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              {['Batch #','Process','Start Date','End Date','Inputs','Outputs','Status'].map(h => (
                                <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {batches.slice(0,30).map(b => {
                              const inQty  = (b.inputs||[]).reduce((s,r)=>s+parseFloat(r.quantity||0),0)
                              const outQty = (b.outputs||[]).reduce((s,r)=>s+parseFloat(r.quantity||0),0)
                              return (
                                <tr key={b.id} className="hover:bg-gray-50/60">
                                  <td className="px-4 py-2.5 font-semibold text-gray-900">{b.batch_number}</td>
                                  <td className="px-4 py-2.5 text-violet-700 font-medium">{b.process_type}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{b.start_date}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{b.end_date || '—'}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{(b.inputs?.length||0)} · {inQty.toLocaleString()} u</td>
                                  <td className="px-4 py-2.5 text-gray-600">{(b.outputs?.length||0)} · {outQty.toLocaleString()} u</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      b.status==='completed'?'bg-emerald-50 text-emerald-700':b.status==='in_progress'?'bg-blue-50 text-blue-700':b.status==='cancelled'?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700'}`}>
                                      {b.status.replace('_',' ')}
                                    </span>
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
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
