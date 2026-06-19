import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

// ─── helpers ────────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)  // yyyy-mm-dd for <input type="date">
}

function toDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

function numFmt(n, dec = 2) {
  if (n === '' || n == null || isNaN(Number(n))) return ''
  return Number(Number(n).toFixed(dec)).toLocaleString('en-PK')
}

function newRow() {
  return {
    id: null,
    description: '',
    pct_code: '',
    pct_code_display: '',
    quantity: '',
    rate: '',
    sales_tax_rate: 18,
    value_excl_tax: 0,
    sales_tax_amount: 0,
    value_incl_tax: 0,
    _key: Math.random().toString(36).slice(2),
  }
}

function calcRow(row) {
  const qty  = Number(row.quantity)  || 0
  const rate = Number(row.rate)      || 0
  const str  = Number(row.sales_tax_rate) || 0
  const excl = qty * rate
  const tax  = excl * str / 100
  return { ...row, value_excl_tax: excl, sales_tax_amount: tax, value_incl_tax: excl + tax }
}

// ─── PCT Code searchable select ─────────────────────────────────────────────
function PCTSelect({ value, display, onChange }) {
  const [query, setQuery]       = useState(display || '')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(display || '') }, [display])

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (q) => {
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.get('pct-codes/', { params: { search: q } })
        setResults(r.data.results ?? r.data)
        setOpen(true)
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); search(e.target.value) }}
        onFocus={() => { if (results.length) setOpen(true) }}
        placeholder="Search PCT…"
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400 bg-gray-50"
      />
      {loading && <div className="absolute right-2 top-2 w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-0.5 w-72 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {results.map(item => (
            <button key={item.id} type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 transition-colors border-b border-gray-50 last:border-0"
              onClick={() => {
                onChange(item.id, `${item.pct_code} — ${item.description}`)
                setQuery(`${item.pct_code} — ${item.description}`)
                setOpen(false)
              }}>
              <span className="font-mono font-semibold text-violet-700">{item.pct_code}</span>
              <span className="text-gray-500 ml-1">— {item.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Customer searchable select ──────────────────────────────────────────────
function CustomerSelect({ value, display, onChange }) {
  const [query, setQuery]     = useState(display || '')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(display || '') }, [display])

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (q) => {
    clearTimeout(timer.current)
    setOpen(false)
    if (!q.trim()) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.get('customers/', { params: { search: q } })
        setResults(r.data.results ?? r.data)
        setOpen(true)
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value) }}
          onFocus={() => { if (results.length) setOpen(true) }}
          placeholder="Search customer…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
        />
        {loading && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map(c => (
            <button key={c.id} type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors border-b border-gray-50 last:border-0"
              onClick={() => {
                onChange(c)
                setQuery(c.name)
                setOpen(false)
              }}>
              <div className="font-medium text-gray-800">{c.name}</div>
              {c.address && <div className="text-xs text-gray-400 truncate">{c.address}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Form ───────────────────────────────────────────────────────────────
export default function InvoiceForm() {
  const navigate   = useNavigate()
  const { id }     = useParams()
  const isEdit     = Boolean(id)

  const [customer, setCustomer]       = useState(null)
  const [customerDisplay, setCustomerDisplay] = useState('')
  const [invoiceNo, setInvoiceNo]     = useState('')
  const [date, setDate]               = useState(todayStr())
  const [notes, setNotes]             = useState('')
  const [rows, setRows]               = useState([newRow()])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [msg, setMsg]                 = useState('')

  // auto-generate invoice number
  useEffect(() => {
    if (!isEdit) {
      api.get('invoices/next_number/').then(r => setInvoiceNo(r.data.invoice_no || '')).catch(() => {
        const ts = Date.now().toString().slice(-6)
        setInvoiceNo(`INV-${ts}`)
      })
    }
  }, [isEdit])

  // load existing invoice for edit
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const [invRes, itemsRes] = await Promise.all([
          api.get(`invoices/${id}/`),
          api.get('invoice-items/', { params: { invoice: id } }),
        ])
        const inv = invRes.data
        setInvoiceNo(inv.invoice_number || inv.invoice_no || '')
        setDate(inv.date || todayStr())
        setNotes(inv.notes || '')
        if (inv.customer_name) {
          setCustomerDisplay(inv.customer_name)
          setCustomer({ id: inv.customer, name: inv.customer_name, address: inv.customer_address || '', str_number: inv.customer_str || '', ntn_number: inv.customer_ntn || '' })
        }
        const items = (itemsRes.data.results ?? itemsRes.data).map(item => calcRow({
          id: item.id,
          description: item.description || '',
          pct_code: item.pct_code || '',
          pct_code_display: item.pct_code_display || '',
          quantity: item.quantity || '',
          rate: item.rate || '',
          sales_tax_rate: item.sales_tax_rate ?? 18,
          _key: Math.random().toString(36).slice(2),
        }))
        setRows(items.length ? items : [newRow()])
      } catch { setError('Failed to load invoice.') }
    }
    load()
  }, [id, isEdit])

  const updateRow = (key, field, val) => {
    setRows(prev => prev.map(r => r._key !== key ? r : calcRow({ ...r, [field]: val })))
  }

  const addRow = () => setRows(prev => [...prev, newRow()])
  const removeRow = (key) => setRows(prev => prev.length > 1 ? prev.filter(r => r._key !== key) : prev)

  const totals = rows.reduce((acc, r) => ({
    qty:  acc.qty  + (Number(r.quantity)         || 0),
    excl: acc.excl + (Number(r.value_excl_tax)   || 0),
    tax:  acc.tax  + (Number(r.sales_tax_amount) || 0),
    incl: acc.incl + (Number(r.value_incl_tax)   || 0),
  }), { qty: 0, excl: 0, tax: 0, incl: 0 })

  const handleSave = async (status) => {
    if (!customer) { setError('Please select a customer.'); return }
    if (!invoiceNo.trim()) { setError('Invoice number is required.'); return }
    const validRows = rows.filter(r => r.description.trim())
    if (!validRows.length) { setError('Add at least one line item.'); return }

    setSaving(true); setError('')
    try {
      const payload = {
        customer: customer.id,
        invoice_number: invoiceNo.trim(),
        date,
        notes,
        status,
        total_qty: totals.qty,
        total_value_excl_tax: totals.excl,
        total_sales_tax: totals.tax,
        total_value_incl_tax: totals.incl,
      }

      let invoiceId = id
      if (isEdit) {
        await api.put(`invoices/${id}/`, payload)
        // delete existing items before re-creating
        const existingItems = await api.get('invoice-items/', { params: { invoice: id } })
        const items = existingItems.data.results ?? existingItems.data
        await Promise.all(items.map(item => api.delete(`invoice-items/${item.id}/`).catch(() => {})))
      } else {
        const r = await api.post('invoices/', payload)
        invoiceId = r.data.id
      }

      // create items
      await Promise.all(validRows.map(row =>
        api.post('invoice-items/', {
          invoice: invoiceId,
          description: row.description,
          pct_code: row.pct_code || null,
          quantity: Number(row.quantity) || 0,
          rate: Number(row.rate) || 0,
          sales_tax_rate: Number(row.sales_tax_rate) || 0,
          value_excl_tax: row.value_excl_tax,
          sales_tax_amount: row.sales_tax_amount,
          value_incl_tax: row.value_incl_tax,
        })
      ))

      setMsg(status === 'issued' ? 'Invoice issued successfully!' : 'Draft saved.')
      setTimeout(() => navigate('/invoices'), 1200)
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Save failed.')
    }
    setSaving(false)
  }

  const InputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
  const CellInput = ({ className = '', ...props }) => (
    <input className={`w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400 bg-gray-50 ${className}`} {...props} />
  )

  return (
    <Layout>
      <div className="p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/invoices')}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Invoice' : 'New Sales Tax Invoice'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Pakistani Sales Tax Invoice Format</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}
        {msg && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">{msg}</div>
        )}

        {/* Top section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Customer */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer *</label>
                <CustomerSelect
                  value={customer?.id}
                  display={customerDisplay}
                  onChange={c => { setCustomer(c); setCustomerDisplay(c.name) }}
                />
              </div>
              {customer && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-0.5">
                  {customer.address && <div><span className="font-medium text-gray-700">Address:</span> {customer.address}</div>}
                  {customer.str_number && <div><span className="font-medium text-gray-700">STR#:</span> {customer.str_number}</div>}
                  {(customer.ntn_number || customer.ntn) && <div><span className="font-medium text-gray-700">NTN#:</span> {customer.ntn_number || customer.ntn}</div>}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Optional notes…"
                  className={InputCls + ' resize-none'} />
              </div>
            </div>
            {/* Right: Invoice meta */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice No *</label>
                <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
                  placeholder="INV-000001" className={InputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className={InputCls} />
                <p className="text-xs text-gray-400 mt-1">Display format: {toDisplayDate(date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
            <h2 className="text-sm font-bold text-gray-700">Line Items</h2>
            <button type="button" onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[200px]">Description of Goods</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[200px]">H.S Code (PCT)</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">Qty Mtr/Yds</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">Rate</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Value Excl. ST</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-20">ST Rate %</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Sales Tax</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Value Incl. ST</th>
                  <th className="w-8 px-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row._key} className="border-b border-gray-50 hover:bg-violet-50/20 transition-colors">
                    <td className="px-3 py-2">
                      <CellInput
                        value={row.description}
                        onChange={e => updateRow(row._key, 'description', e.target.value)}
                        placeholder="e.g. 96x72/40x40-96″ Pc"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <PCTSelect
                        value={row.pct_code}
                        display={row.pct_code_display}
                        onChange={(id, disp) => updateRow(row._key, 'pct_code_display',
                          // update both fields atomically
                          setRows(prev => prev.map(r => r._key !== row._key ? r : { ...r, pct_code: id, pct_code_display: disp })) || disp
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <CellInput
                        type="number" min="0" step="0.001"
                        value={row.quantity}
                        onChange={e => updateRow(row._key, 'quantity', e.target.value)}
                        className="text-right"
                        placeholder="0.000"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <CellInput
                        type="number" min="0" step="0.01"
                        value={row.rate}
                        onChange={e => updateRow(row._key, 'rate', e.target.value)}
                        className="text-right"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-right font-semibold text-gray-700 px-2 py-1.5 bg-blue-50 rounded-lg">
                        {numFmt(row.value_excl_tax)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <CellInput
                        type="number" min="0" max="100" step="0.01"
                        value={row.sales_tax_rate}
                        onChange={e => updateRow(row._key, 'sales_tax_rate', e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-right font-semibold text-amber-700 px-2 py-1.5 bg-amber-50 rounded-lg">
                        {numFmt(row.sales_tax_amount)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-right font-bold text-emerald-700 px-2 py-1.5 bg-emerald-50 rounded-lg">
                        {numFmt(row.value_incl_tax)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button type="button" onClick={() => removeRow(row._key)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Grand Total */}
              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                  <td colSpan={2} className="px-3 py-3 font-bold text-gray-700 text-xs border-t-2 border-violet-200">
                    Grand Total
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs border-t-2 border-violet-200">
                    {numFmt(totals.qty, 3)}
                  </td>
                  <td className="border-t-2 border-violet-200" />
                  <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs border-t-2 border-violet-200">
                    {numFmt(totals.excl)}
                  </td>
                  <td className="border-t-2 border-violet-200" />
                  <td className="px-3 py-3 text-right font-bold text-amber-700 text-xs border-t-2 border-violet-200">
                    {numFmt(totals.tax)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-700 text-xs border-t-2 border-violet-200">
                    {numFmt(totals.incl)}
                  </td>
                  <td className="border-t-2 border-violet-200" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Row button (below table) */}
          <div className="px-6 py-3 border-t border-gray-50">
            <button type="button" onClick={addRow}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button" disabled={saving}
            onClick={() => handleSave('draft')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button" disabled={saving}
            onClick={() => handleSave('issued')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            {saving ? 'Saving…' : 'Issue Invoice'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  )
}
