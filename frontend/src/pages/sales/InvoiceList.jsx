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
  const [y, m, day] = d.split('-')
  return `${day}-${m}-${y}`
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError]             = useState('')

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null) // invoice obj
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling]   = useState(false)

  // Credit Note modal
  const [cnModal, setCnModal]         = useState(null) // invoice obj
  const [cnReason, setCnReason]       = useState('')
  const [cnSaving, setCnSaving]       = useState(false)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)       params.search    = search
      if (dateFrom)     params.date_from = dateFrom
      if (dateTo)       params.date_to   = dateTo
      if (statusFilter) params.status    = statusFilter
      const r = await api.get('invoices/', { params })
      setInvoices(r.data.results ?? r.data)
    } catch { setError('Failed to load invoices.') }
    setLoading(false)
  }, [search, dateFrom, dateTo, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const totals = invoices.reduce((acc, inv) => ({
    qty:  acc.qty  + Number(inv.total_qty            || 0),
    excl: acc.excl + Number(inv.total_value_excl_tax || 0),
    tax:  acc.tax  + Number(inv.total_sales_tax      || 0),
    incl: acc.incl + Number(inv.total_value_incl_tax || 0),
  }), { qty: 0, excl: 0, tax: 0, incl: 0 })

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    setCancelling(true)
    try {
      await api.post(`invoices/${cancelModal.id}/cancel/`, { reason: cancelReason })
      setCancelModal(null); setCancelReason('')
      fetchInvoices()
    } catch (e) {
      alert(e.response?.data?.detail || 'Cancel failed.')
    }
    setCancelling(false)
  }

  // ── Credit Note ─────────────────────────────────────────────────────────────
  const handleCreditNote = async () => {
    if (!cnReason.trim()) return
    setCnSaving(true)
    try {
      const res = await api.post(`invoices/${cnModal.id}/credit_note/`, { reason: cnReason })
      setCnModal(null); setCnReason('')
      fetchInvoices()
      navigate(`/invoices/${res.data.id}/print`)
    } catch (e) {
      alert(e.response?.data?.detail || 'Credit Note creation failed.')
    }
    setCnSaving(false)
  }

  // ── Action buttons per status ────────────────────────────────────────────────
  function ActionButtons({ inv }) {
    const isFbrSubmitted = inv.fbr_status === 'submitted' || inv.fbr_status === 'accepted'

    if (inv.status === 'draft') {
      return (
        <div className="flex items-center gap-1.5">
          <Btn color="violet" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>Edit</Btn>
          <Btn color="emerald" onClick={() => navigate(`/invoices/${inv.id}/print`)}>Print</Btn>
        </div>
      )
    }

    if (inv.status === 'issued') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Btn color="emerald" onClick={() => navigate(`/invoices/${inv.id}/print`)}>Print</Btn>
          {!isFbrSubmitted && (
            <Btn color="amber" onClick={() => { setCancelModal(inv); setCancelReason('') }}>Cancel</Btn>
          )}
          <Btn color="blue" onClick={() => { setCnModal(inv); setCnReason('') }}>Credit Note</Btn>
        </div>
      )
    }

    if (inv.status === 'paid') {
      return (
        <div className="flex items-center gap-1.5">
          <Btn color="emerald" onClick={() => navigate(`/invoices/${inv.id}/print`)}>Print</Btn>
          <Btn color="blue" onClick={() => { setCnModal(inv); setCnReason('') }}>Credit Note</Btn>
        </div>
      )
    }

    // cancelled
    return (
      <div className="flex items-center gap-1.5">
        <Btn color="gray" onClick={() => navigate(`/invoices/${inv.id}/print`)}>View</Btn>
      </div>
    )
  }

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
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Invoice No or Customer…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50" />
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

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                  {['Invoice No','Customer','Date','Total Qty','Value Excl. ST','Sales Tax','Total Incl. ST','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
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
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm">No invoices found. <button onClick={() => navigate('/invoices/new')} className="text-violet-600 hover:underline">Create one.</button></span>
                  </td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-violet-50/30 transition-colors border-b border-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-violet-700">{inv.invoice_no || inv.invoice_number || `INV-${inv.id}`}</span>
                      {inv.is_credit_note && (
                        <span className="ml-1.5 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">CN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{inv.customer_name || inv.customer}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_qty)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_value_excl_tax)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fmt(inv.total_sales_tax)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.total_value_incl_tax)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>
                        {inv.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <ActionButtons inv={inv} />
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

        {/* ── Cancel Modal ── */}
        {cancelModal && (
          <Modal title={`Cancel Invoice ${cancelModal.invoice_number}`} onClose={() => setCancelModal(null)}>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong>Warning:</strong> Cancelling an invoice is a legal record. Provide a clear reason.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cancellation Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  rows={3} placeholder="e.g. Wrong customer details, duplicate invoice…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCancel} disabled={cancelling || !cancelReason.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all">
                {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </Modal>
        )}

        {/* ── Credit Note Modal ── */}
        {cnModal && (
          <Modal title={`Issue Credit Note for ${cnModal.invoice_number}`} onClose={() => setCnModal(null)}>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                A <strong>Credit Note</strong> will be created with negative quantities reversing the original invoice. This is the legally correct way to correct an issued invoice under FBR rules.
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 space-y-0.5">
                <div><span className="font-semibold">Original Invoice:</span> {cnModal.invoice_number}</div>
                <div><span className="font-semibold">Customer:</span> {cnModal.customer_name}</div>
                <div><span className="font-semibold">Amount:</span> Rs. {fmt(cnModal.total_value_incl_tax)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Credit Note <span className="text-red-500">*</span></label>
                <textarea
                  value={cnReason} onChange={e => setCnReason(e.target.value)}
                  rows={3} placeholder="e.g. Goods returned, pricing error, quantity dispute…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setCnModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreditNote} disabled={cnSaving || !cnReason.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                {cnSaving ? 'Creating…' : 'Issue Credit Note'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Btn({ color, onClick, children }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    amber:  'bg-amber-50 text-amber-700 hover:bg-amber-100',
    blue:   'bg-blue-50 text-blue-700 hover:bg-blue-100',
    gray:   'bg-gray-100 text-gray-600 hover:bg-gray-200',
  }
  return (
    <button onClick={onClick} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${colors[color]}`}>
      {children}
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
