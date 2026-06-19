import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const defaultForm = {
  name: '',
  description: '',
  pct_code: '',
  category: '',
  unit: '',
  retail_price: '',
  wholesale_price: '',
  sales_tax_rate: '18.00',
  barcode: '',
  is_active: true,
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

function Badge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Inactive
    </span>
  )
}

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [pctSearch, setPctSearch] = useState('')
  const [pctOptions, setPctOptions] = useState([])
  const [pctLoading, setPctLoading] = useState(false)
  const [showPctDropdown, setShowPctDropdown] = useState(false)
  const [selectedPct, setSelectedPct] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pctRef = useRef(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products/')
      setProducts(res.data.results ?? res.data)
    } catch {
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/units/'),
        api.get('/categories/'),
      ])
      setUnits(uRes.data.results ?? uRes.data)
      setCategories(cRes.data.results ?? cRes.data)
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchMeta()
  }, [])

  useEffect(() => {
    if (!pctSearch.trim()) { setPctOptions([]); return }
    const timer = setTimeout(async () => {
      setPctLoading(true)
      try {
        const res = await api.get(`/api/pct-codes/?search=${encodeURIComponent(pctSearch)}`)
        setPctOptions(res.data.results ?? res.data)
      } catch {
        setPctOptions([])
      } finally {
        setPctLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [pctSearch])

  useEffect(() => {
    const handler = (e) => {
      if (pctRef.current && !pctRef.current.contains(e.target)) {
        setShowPctDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setSelectedPct(null)
    setPctSearch('')
    setPctOptions([])
    setError('')
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      pct_code: product.pct_code ?? '',
      category: product.category ?? '',
      unit: product.unit ?? '',
      retail_price: product.retail_price ?? '',
      wholesale_price: product.wholesale_price ?? '',
      sales_tax_rate: product.sales_tax_rate ?? '18.00',
      barcode: product.barcode ?? '',
      is_active: product.is_active ?? true,
    })
    setSelectedPct(product.pct_code ? { pct_code: product.pct_code, description: product.pct_code_description ?? '' } : null)
    setPctSearch(product.pct_code ?? '')
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleField = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Product name is required.'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/api/products/${editing.id}/`, form)
      } else {
        await api.post('/products/', form)
      }
      closeModal()
      fetchProducts()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Save failed. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/products/${product.id}/`)
      fetchProducts()
    } catch {
      alert('Delete failed.')
    }
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="p-6 lg:p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your product catalog</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-lg hover:scale-105 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or barcode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Name', 'PCT Code', 'Category', 'Unit', 'Retail Price', 'Sales Tax %', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                        </svg>
                        No products found
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.pct_code ? (
                          <span className="font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs border border-violet-100">{p.pct_code}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.category_name ?? p.category ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.unit_name ?? p.unit ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {p.retail_price ? `Rs ${parseFloat(p.retail_price).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.sales_tax_rate ?? '—'}%</td>
                      <td className="px-4 py-3"><Badge active={p.is_active} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Product' : 'Add Product'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editing ? `Editing: ${editing.name}` : 'Fill in the details below'}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleField}
                  placeholder="e.g. Lawn Fabric Premium"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleField}
                  rows={2}
                  placeholder="Optional product description…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all resize-none"
                />
              </div>

              {/* PCT Code searchable */}
              <div ref={pctRef} className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">PCT Code</label>
                <input
                  value={pctSearch}
                  onChange={e => {
                    setPctSearch(e.target.value)
                    setShowPctDropdown(true)
                    setForm(f => ({ ...f, pct_code: '' }))
                    setSelectedPct(null)
                  }}
                  onFocus={() => pctSearch && setShowPctDropdown(true)}
                  placeholder="Type to search PCT codes…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                />
                {showPctDropdown && (pctOptions.length > 0 || pctLoading) && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {pctLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">Searching…</div>
                    ) : pctOptions.map((opt, i) => (
                      <button
                        key={opt.id ?? opt.pct_code ?? i}
                        type="button"
                        onClick={() => {
                          setSelectedPct(opt)
                          setForm(f => ({ ...f, pct_code: opt.pct_code }))
                          setPctSearch(`${opt.pct_code} — ${opt.description}`)
                          setShowPctDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-violet-50 text-sm flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <span className="font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs shrink-0 border border-violet-100">
                          {opt.pct_code}
                        </span>
                        <span className="text-gray-600 truncate">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPct && (
                  <p className="mt-1 text-xs text-violet-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected: {selectedPct.pct_code}
                  </p>
                )}
              </div>

              {/* Category + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleField}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  >
                    <option value="">— Select —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit</label>
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleField}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  >
                    <option value="">— Select —</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Retail Price (Rs)</label>
                  <input
                    type="number"
                    name="retail_price"
                    value={form.retail_price}
                    onChange={handleField}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Wholesale Price (Rs)</label>
                  <input
                    type="number"
                    name="wholesale_price"
                    value={form.wholesale_price}
                    onChange={handleField}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Tax + Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    name="sales_tax_rate"
                    value={form.sales_tax_rate}
                    onChange={handleField}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Barcode</label>
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleField}
                    placeholder="Scan or enter barcode"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-violet-600' : 'bg-gray-200'}`}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Active product</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
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
                  {saving ? 'Saving…' : (editing ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}


