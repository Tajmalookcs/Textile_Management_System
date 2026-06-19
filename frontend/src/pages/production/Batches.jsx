import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const today = () => new Date().toISOString().split('T')[0]

const STATUS = {
  pending:     { cls: 'bg-amber-50 text-amber-700',    label: 'Pending' },
  in_progress: { cls: 'bg-blue-50 text-blue-700',      label: 'In Progress' },
  completed:   { cls: 'bg-emerald-50 text-emerald-700',label: 'Completed' },
  cancelled:   { cls: 'bg-red-50 text-red-600',        label: 'Cancelled' },
}

const PROCESS_TYPES = ['Dyeing', 'Bleaching', 'Printing', 'Weaving', 'Finishing', 'Washing', 'Other']

const emptyRow = () => ({ product: '', quantity: '' })

export default function Batches() {
  const [batches, setBatches]   = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewBatch, setViewBatch] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('all')

  // form
  const [batchNo, setBatchNo]       = useState('')
  const [processType, setProcessType] = useState('Dyeing')
  const [startDate, setStartDate]   = useState(today())
  const [endDate, setEndDate]       = useState('')
  const [notes, setNotes]           = useState('')
  const [inputs, setInputs]         = useState([emptyRow()])
  const [outputs, setOutputs]       = useState([emptyRow()])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, pRes] = await Promise.all([
        api.get('batches/'),
        api.get('products/'),
      ])
      setBatches(bRes.data?.results ?? bRes.data)
      setProducts(pRes.data?.results ?? pRes.data)
    } catch { setBatches([]); setProducts([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openNew = () => {
    const nextNum = String(batches.length + 1).padStart(4, '0')
    setBatchNo(`BATCH-${nextNum}`)
    setProcessType('Dyeing')
    setStartDate(today())
    setEndDate('')
    setNotes('')
    setInputs([emptyRow()])
    setOutputs([emptyRow()])
    setError('')
    setShowModal(true)
  }

  const updateRow = (setter, idx, field, val) =>
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const addRow    = setter => setter(prev => [...prev, emptyRow()])
  const removeRow = (setter, idx, arr) => arr.length > 1 && setter(prev => prev.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!batchNo.trim()) { setError('Batch number is required.'); return }
    if (!processType)    { setError('Process type is required.'); return }
    if (!startDate)      { setError('Start date is required.'); return }

    setSaving(true); setError('')
    try {
      const bRes = await api.post('batches/', {
        batch_number: batchNo.trim(),
        process_type: processType,
        status: 'pending',
        start_date: startDate,
        end_date: endDate || null,
        notes,
      })
      const bId = bRes.data.id

      const validInputs  = inputs.filter(r => r.product && r.quantity)
      const validOutputs = outputs.filter(r => r.product && r.quantity)

      await Promise.all([
        ...validInputs.map(r  => api.post('batch-inputs/',  { batch: bId, product: r.product, quantity: parseFloat(r.quantity) })),
        ...validOutputs.map(r => api.post('batch-outputs/', { batch: bId, product: r.product, quantity: parseFloat(r.quantity) })),
      ])

      await fetchAll()
      setShowModal(false)
    } catch (e) {
      setError(e?.response?.data?.batch_number?.[0] || e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Failed to create batch.')
    } finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`batches/${id}/`, { status })
      setBatches(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      if (viewBatch?.id === id) setViewBatch(prev => ({ ...prev, status }))
    } catch { alert('Failed to update status.') }
  }

  const filtered = filter === 'all' ? batches : batches.filter(b => b.status === filter)

  const productName = id => products.find(p => p.id === Number(id) || p.id === id)?.name || `#${id}`

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50'
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1'

  // ── summary counts ──
  const counts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
  batches.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++ })

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9]">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10"
          style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#d97706 0%,transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />

          <div className="relative z-10 flex items-start justify-between mb-8">
            <div>
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-2">Production</p>
              <h1 className="text-3xl font-bold text-white mb-1">Processing Batches</h1>
              <p className="text-white/50 text-sm">Manage dyeing, bleaching, printing & other processes</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all no-print mt-1"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Batch
            </button>
          </div>

          {/* Stat cards */}
          <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { key: 'pending',     label: 'Pending',     color: '#d97706', icon: '⏳' },
              { key: 'in_progress', label: 'In Progress', color: '#4f46e5', icon: '⚙️' },
              { key: 'completed',   label: 'Completed',   color: '#059669', icon: '✅' },
              { key: 'cancelled',   label: 'Cancelled',   color: '#dc2626', icon: '❌' },
            ].map((s, i) => (
              <div key={s.key} className="rounded-2xl p-5 card-hover animate-fadeIn cursor-pointer"
                style={{ animationDelay: `${i * 80}ms`, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: `1px solid rgba(255,255,255,0.12)`, outline: filter === s.key ? `2px solid ${s.color}` : 'none' }}
                onClick={() => setFilter(prev => prev === s.key ? 'all' : s.key)}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-xs font-medium">{s.label}</p>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <p className="text-3xl font-bold text-white">{counts[s.key]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-200 hover:border-violet-300'}`}
                style={filter === f ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                {f === 'all' ? `All (${batches.length})` : STATUS[f]?.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Loading batches…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-2xl">⚙️</div>
                <p className="font-semibold text-gray-500">No batches found</p>
                <p className="text-sm mt-1 text-gray-400">
                  {filter === 'all' ? 'Click "New Batch" to create your first processing batch.' : `No ${STATUS[filter]?.label.toLowerCase()} batches.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Batch #', 'Process Type', 'Start Date', 'End Date', 'Status', 'Inputs', 'Outputs', 'Actions'].map(h => (
                        <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(b => {
                      const st = STATUS[b.status] || STATUS.pending
                      const inQty  = (b.inputs  || []).reduce((s, r) => s + parseFloat(r.quantity || 0), 0)
                      const outQty = (b.outputs || []).reduce((s, r) => s + parseFloat(r.quantity || 0), 0)
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{b.batch_number}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700">
                              {b.process_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.start_date}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.end_date || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {(b.inputs?.length || 0)} item{(b.inputs?.length || 0) !== 1 ? 's' : ''} · {inQty.toLocaleString()} units
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {(b.outputs?.length || 0)} item{(b.outputs?.length || 0) !== 1 ? 's' : ''} · {outQty.toLocaleString()} units
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setViewBatch(b)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              {b.status === 'pending' && (
                                <button onClick={() => updateStatus(b.id, 'in_progress')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                                  Start
                                </button>
                              )}
                              {b.status === 'in_progress' && (
                                <button onClick={() => updateStatus(b.id, 'completed')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                  Complete
                                </button>
                              )}
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
          {!loading && filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 px-1">{filtered.length} batch{filtered.length !== 1 ? 'es' : ''} shown</p>
          )}
        </div>
      </div>

      {/* ── New Batch Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-gray-900 text-lg">New Processing Batch</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl transition-colors">×</button>
            </div>

            <div className="p-6 space-y-6">
              {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Batch Number <span className="text-red-500">*</span></label>
                  <input className={inp} value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="e.g. BATCH-0001" />
                </div>
                <div>
                  <label className={lbl}>Process Type <span className="text-red-500">*</span></label>
                  <select className={inp} value={processType} onChange={e => setProcessType(e.target.value)}>
                    {PROCESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Start Date <span className="text-red-500">*</span></label>
                  <input type="date" className={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>End Date <span className="text-gray-400">(optional)</span></label>
                  <input type="date" className={inp} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Notes</label>
                  <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
                </div>
              </div>

              {/* Input / Output tables side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inputs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700">Raw Material Inputs</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Products going into this batch</p>
                    </div>
                    <button onClick={() => addRow(setInputs)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                      + Add
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-wider w-24">Quantity</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {inputs.map((r, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                value={r.product} onChange={e => updateRow(setInputs, idx, 'product', e.target.value)}>
                                <option value="">Select…</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                value={r.quantity} onChange={e => updateRow(setInputs, idx, 'quantity', e.target.value)} />
                            </td>
                            <td className="px-2 py-2">
                              <button onClick={() => removeRow(setInputs, idx, inputs)} disabled={inputs.length === 1}
                                className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-30">
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Outputs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700">Finished Outputs</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Products produced from this batch</p>
                    </div>
                    <button onClick={() => addRow(setOutputs)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                      + Add
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-wider w-24">Quantity</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {outputs.map((r, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                value={r.product} onChange={e => updateRow(setOutputs, idx, 'product', e.target.value)}>
                                <option value="">Select…</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                value={r.quantity} onChange={e => updateRow(setOutputs, idx, 'quantity', e.target.value)} />
                            </td>
                            <td className="px-2 py-2">
                              <button onClick={() => removeRow(setOutputs, idx, outputs)} disabled={outputs.length === 1}
                                className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-30">
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {saving ? 'Creating…' : 'Create Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Batch Detail Modal ── */}
      {viewBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{viewBatch.batch_number}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{viewBatch.process_type}</p>
              </div>
              <button onClick={() => setViewBatch(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl transition-colors">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Status', val: <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS[viewBatch.status]?.cls}`}>{STATUS[viewBatch.status]?.label}</span> },
                  { label: 'Process', val: viewBatch.process_type },
                  { label: 'Start Date', val: viewBatch.start_date },
                  { label: 'End Date', val: viewBatch.end_date || '—' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">{m.label}</p>
                    <div className="text-sm font-semibold text-gray-800">{m.val}</div>
                  </div>
                ))}
              </div>

              {viewBatch.notes && (
                <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-800">
                  <span className="font-semibold">Notes: </span>{viewBatch.notes}
                </div>
              )}

              {/* Inputs */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Raw Material Inputs</h4>
                {(viewBatch.inputs || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No inputs recorded.</p>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {viewBatch.inputs.map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 text-gray-700">{r.product_name || productName(r.product)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{Number(r.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Outputs */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Finished Outputs</h4>
                {(viewBatch.outputs || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No outputs recorded.</p>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {viewBatch.outputs.map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 text-gray-700">{r.product_name || productName(r.product)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{Number(r.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Status actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-between items-center sticky bottom-0 bg-white rounded-b-3xl">
              <div className="flex gap-2">
                {viewBatch.status === 'pending' && (
                  <button onClick={() => updateStatus(viewBatch.id, 'in_progress')}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#3b82f6)' }}>
                    → Start Processing
                  </button>
                )}
                {viewBatch.status === 'in_progress' && (
                  <button onClick={() => updateStatus(viewBatch.id, 'completed')}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}>
                    ✓ Mark Complete
                  </button>
                )}
                {(viewBatch.status === 'pending' || viewBatch.status === 'in_progress') && (
                  <button onClick={() => updateStatus(viewBatch.id, 'cancelled')}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    Cancel Batch
                  </button>
                )}
              </div>
              <button onClick={() => setViewBatch(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
