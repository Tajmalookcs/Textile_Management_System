import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-600',
  issued:    'bg-blue-100 text-blue-700',
  paid:      'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

function fmt(n) {
  if (n == null || n === '') return '—'
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${dt.getFullYear()}`
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)      params.search    = search
      if (dateFrom)    params.date_from = dateFrom
      if (dateTo)      params.date_to   = dateTo
      if (statusFilter) params.status   = statusFilter
      const r = await api.get('invoices/', { params })
      setInvoices(r.data.results ?? r.data)
    } catch { setError('Failed to load invoices.') }
    setLoading(false)
  }, [search, dateFrom, dateTo, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const totals = invoices.reduce((acc, inv) => ({
    qty:   acc.qty   + Number(inv.total_qty   || 0),
    excl:  acc.excl  + Number(inv.total_value_excl_tax || 0),
    tax:   acc.tax   + Number(inv.total_sales_tax      || 0),
    incl:  acc.incl  + Number(inv.total_value_incl_tax || 0),
  }), { qty: 0, excl: 0, tax: 0, incl: 0 })

  return (
    <Layout>
      <div className="p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Tax Invoices</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage and print Pakistani Sales Tax Invoices</p>
          </div>
          <button
            onClick={() => navigate('/invoices/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Invoice No or Customer…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={fetchInvoices}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors">
            Search
          </button>
          <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStatusFilter('') }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            Clear
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Invoice No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Total Qty</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Value Excl. ST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Sales Tax</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Total Incl. ST</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 border-b border-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading invoices…</span>
                    </div>
                  </td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm">No invoices found. <button onClick={() => navigate('/invoices/new')} className="text-violet-600 hover:underline">Create one.</button></span>
                    </div>
                  </td></tr>
                ) : invoices.map((inv, i) => (
                  <tr key={inv.id}
                    className="cursor-pointer hover:bg-violet-50/40 transition-colors border-b border-gray-50"
                    onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-violet-700">{inv.invoice_no || `INV-${inv.id}`}</td>
                    <td className="px-4 py-3 text-gray-800">{inv.customer_name || inv.customer}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_qty)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_value_excl_tax)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_sales_tax)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.total_value_incl_tax)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>
                        {inv.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                        >Edit</button>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/print`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >Print</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {invoices.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                    <td colSpan={3} className="px-4 py-3 font-bold text-gray-700 border-t-2 border-violet-200">
                      Grand Total ({invoices.length} invoice{invoices.length !== 1 ? 's' : ''})
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-t-2 border-violet-200">{fmt(totals.qty)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-t-2 border-violet-200">{fmt(totals.excl)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-t-2 border-violet-200">{fmt(totals.tax)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-t-2 border-violet-200">{fmt(totals.incl)}</td>
                    <td colSpan={2} className="border-t-2 border-violet-200" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
