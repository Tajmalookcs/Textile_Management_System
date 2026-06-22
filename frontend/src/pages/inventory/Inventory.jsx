import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const TX_TYPES = [
  { value: 'in', label: 'Stock In', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'out', label: 'Stock Out', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'adjust', label: 'Adjustment', color: 'text-amber-700 bg-amber-50 border-amber-200' },
]

const txStyle = (type) => {
  const t = TX_TYPES.find(x => x.value === type?.toLowerCase())
  return t?.color ?? 'text-gray-600 bg-gray-100 border-gray-200'
}

const txLabel = (type) => {
  const t = TX_TYPES.find(x => x.value === type?.toLowerCase())
  return t?.label ?? type ?? '—'
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

const defaultForm = {
  product: '',
  warehouse: '',
  transaction_type: 'in',
  quantity: '',
  reference: '',
  notes: '',
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock')
  const [stock, setStock] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loadingStock, setLoadingStock] = useState(true)
  const [loadingTx, setLoadingTx] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stockSearch, setStockSearch] = useState('')
  const [txSearch, setTxSearch] = useState('')

  const fetchStock = async () => {
    setLoadingStock(true)
    try {
      const res = await api.get('/stock/')
      setStock(res.data.results ?? res.data)
    } catch {
      setStock([])
    } finally {
      setLoadingStock(false)
    }
  }

  const fetchTransactions = async () => {
    setLoadingTx(true)
    try {
      const res = await api.get('/stock-transactions/')
      setTransactions(res.data.results ?? res.data)
    } catch {
      setTransactions([])
    } finally {
      setLoadingTx(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        api.get('/products/'),
        api.get('/warehouses/'),
      ])
      setProducts(pRes.data.results ?? pRes.data)
      setWarehouses(wRes.data.results ?? wRes.data)
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    fetchStock()
    fetchMeta()
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions' && transactions.length === 0) {
      fetchTransactions()
    }
  }, [activeTab])

  const handleField = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product) { setError('Please select a product.'); return }
    if (!form.warehouse) { setError('Please select a warehouse.'); return }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Quantity must be greater than zero.'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/stock-transactions/', form)
      setShowModal(false)
      setForm(defaultForm)
      fetchStock()
      fetchTransactions()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Failed to save. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const openModal = () => {
    setForm(defaultForm)
    setError('')
    setShowModal(true)
  }

  const filteredStock = stock.filter(s =>
    s.product_name?.toLowerCase().includes(stockSearch.toLowerCase()) ||
    s.warehouse_name?.toLowerCase().includes(stockSearch.toLowerCase())
  )

  const filteredTx = transactions.filter(t =>
    t.product_name?.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.reference?.toLowerCase().includes(txSearch.toLowerCase())
  )

  const tabs = [
    { key: 'stock', label: 'Current Stock' },
    { key: 'transactions', label: 'Transactions' },
  ]

  return (
    <Layout>
      <div className="p-6 lg:p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Stock levels and movement history</p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-lg hover:scale-105 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Stock Entry
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Current Stock Tab */}
        {activeTab === 'stock' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
              <div className="relative max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product or warehouse…"
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loadingStock ? <Spinner /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Product', 'Warehouse', 'Quantity', 'Unit'].map(h => (
                          <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-16 text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            No stock records found
                          </td>
                        </tr>
                      ) : filteredStock.map((s, i) => (
                        <tr key={s.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{s.product_name ?? s.product}</td>
                          <td className="px-4 py-3 text-gray-600">{s.warehouse_name ?? s.warehouse}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold text-base ${Number(s.quantity) <= 0 ? 'text-red-500' : Number(s.quantity) < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {s.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.unit_name ?? s.unit ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {!loadingStock && (
              <p className="text-xs text-gray-400 mt-3 px-1">
                {filteredStock.length} stock record{filteredStock.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
              <div className="relative max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product or reference…"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loadingTx ? <Spinner /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Date', 'Product', 'Type', 'Quantity', 'Reference', 'Notes'].map(h => (
                          <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            No transactions found
                          </td>
                        </tr>
                      ) : filteredTx.map((t, i) => (
                        <tr key={t.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {t.created_at
                              ? new Date(t.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                              : t.date ?? '—'}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{t.product_name ?? t.product}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${txStyle(t.transaction_type)}`}>
                              {txLabel(t.transaction_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-700">{t.quantity}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{t.reference || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {!loadingTx && (
              <p className="text-xs text-gray-400 mt-3 px-1">
                {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Stock Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Stock Entry</h2>
                <p className="text-xs text-gray-400 mt-0.5">Record a stock movement</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Transaction type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Transaction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {TX_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, transaction_type: t.value }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.transaction_type === t.value
                          ? t.color + ' shadow-sm scale-105'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {t.value === 'in' && (
                        <svg className="w-3.5 h-3.5 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      {t.value === 'out' && (
                        <svg className="w-3.5 h-3.5 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {t.value === 'adjust' && (
                        <svg className="w-3.5 h-3.5 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      )}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="product"
                  value={form.product}
                  onChange={handleField}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                >
                  <option value="">— Select product —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  name="warehouse"
                  value={form.warehouse}
                  onChange={handleField}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                >
                  <option value="">— Select warehouse —</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity + Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleField}
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reference</label>
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={handleField}
                    placeholder="PO#, GRN#, etc."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleField}
                  rows={2}
                  placeholder="Optional notes…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}


