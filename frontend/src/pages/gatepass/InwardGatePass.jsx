import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'

const STATUS_COLORS = {
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const EMPTY_ITEM = { description: '', quantity: '', unit: '', weight_kg: '', remarks: '' }

export default function InwardGatePass() {
  const [passes, setPasses]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [printId, setPrintId]   = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState({
    gate_pass_number: '', date: today(), time: nowTime(),
    supplier: '', supplier_name: '', vehicle_number: '',
    driver_name: '', driver_cnic: '', purchase_order: '',
    received_by: '', security_officer: '', remarks: '', status: 'pending',
  })
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)

  function today() {
    return new Date().toISOString().slice(0, 10)
  }
  function nowTime() {
    return new Date().toTimeString().slice(0, 5)
  }

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      const r = await api.get('gate-passes/', { params })
      setPasses(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterStatus])

  useEffect(() => {
    api.get('suppliers/').then(r => setSuppliers(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const openNew = async () => {
    const r = await api.get('gate-passes/next_number/')
    setForm({ gate_pass_number: r.data.gate_pass_number, date: today(), time: nowTime(), supplier: '', supplier_name: '', vehicle_number: '', driver_name: '', driver_cnic: '', purchase_order: '', received_by: '', security_officer: '', remarks: '', status: 'pending' })
    setItems([{ ...EMPTY_ITEM }])
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = async (gp) => {
    setForm({
      gate_pass_number: gp.gate_pass_number, date: gp.date, time: gp.time,
      supplier: gp.supplier ?? '', supplier_name: gp.supplier_name,
      vehicle_number: gp.vehicle_number, driver_name: gp.driver_name,
      driver_cnic: gp.driver_cnic, purchase_order: gp.purchase_order ?? '',
      received_by: gp.received_by, security_officer: gp.security_officer,
      remarks: gp.remarks, status: gp.status,
    })
    setItems(gp.items?.length ? gp.items.map(i => ({
      id: i.id, description: i.description, quantity: i.quantity,
      unit: i.unit, weight_kg: i.weight_kg, remarks: i.remarks,
    })) : [{ ...EMPTY_ITEM }])
    setEditId(gp.id)
    setShowForm(true)
  }

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      let gp
      const payload = { ...form, supplier: form.supplier || null, purchase_order: form.purchase_order || null }
      if (editId) {
        const r = await api.patch(`gate-passes/${editId}/`, payload)
        gp = r.data
      } else {
        const r = await api.post('gate-passes/', payload)
        gp = r.data
      }
      // sync items
      const existingItems = gp.items ?? []
      const existingIds = existingItems.map(i => i.id)
      for (const item of items) {
        if (!item.description) continue
        const row = { gate_pass: gp.id, description: item.description, quantity: parseFloat(item.quantity) || 0, unit: item.unit, weight_kg: parseFloat(item.weight_kg) || 0, remarks: item.remarks }
        if (item.id) await api.patch(`gate-pass-items/${item.id}/`, row)
        else await api.post('gate-pass-items/', row)
      }
      // delete removed items
      for (const id of existingIds) {
        if (!items.find(i => i.id === id)) await api.delete(`gate-pass-items/${id}/`)
      }
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (id, action) => {
    await api.post(`gate-passes/${id}/${action}/`)
    load()
  }

  const setItemField = (idx, key, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  }
  const addItemRow = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItemRow = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  const selectedGP = passes.find(p => p.id === printId)

  if (printId && selectedGP) return <PrintView gp={selectedGP} onClose={() => setPrintId(null)} />

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Inward Gate Pass</h1>
            <p className="text-white/40 text-sm mt-0.5">Record incoming material from suppliers</p>
          </div>
          <button onClick={openNew}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            + New Gate Pass
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gate pass #, supplier, vehicle..."
            className="flex-1 min-w-[220px] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <select value={filterStatus} onChange={e => setFilter(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Gate Pass #','Date','Supplier / Party','Vehicle No.','Driver','Status','Items','Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-white/30">Loading…</td></tr>
              ) : passes.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-white/20">No gate passes found.</td></tr>
              ) : passes.map(gp => (
                <tr key={gp.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-violet-300">{gp.gate_pass_number}</td>
                  <td className="px-4 py-3.5 text-white/70">{gp.date}</td>
                  <td className="px-4 py-3.5 text-white/80">{gp.supplier_label || gp.supplier_name || '—'}</td>
                  <td className="px-4 py-3.5 text-white/60">{gp.vehicle_number || '—'}</td>
                  <td className="px-4 py-3.5 text-white/60">{gp.driver_name || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${STATUS_COLORS[gp.status]}`}>
                      {gp.status_display || gp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-white/50">{gp.items?.length ?? 0}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => setPrintId(gp.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all">
                        Print
                      </button>
                      {gp.status === 'pending' && (
                        <>
                          <button onClick={() => openEdit(gp)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60 transition-all">
                            Edit
                          </button>
                          <button onClick={() => changeStatus(gp.id, 'approve')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
                            Approve
                          </button>
                          <button onClick={() => changeStatus(gp.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/60 transition-all">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-4xl my-8 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#0d0b1e,#1a1542)', border: '1px solid rgba(124,58,237,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-lg font-bold text-white">{editId ? 'Edit' : 'New'} Inward Gate Pass</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white text-2xl transition-colors">×</button>
            </div>

            <form onSubmit={save} className="p-6 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Gate Pass #" value={form.gate_pass_number} readOnly />
                <Field label="Date *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} required />
                <Field label="Time *" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} required />
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Supplier (from list)</label>
                  <select value={form.supplier} onChange={e => {
                    const s = suppliers.find(s => String(s.id) === e.target.value)
                    setForm(f => ({ ...f, supplier: e.target.value, supplier_name: s?.name || f.supplier_name }))
                  }}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <option value="">— Select or type below —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <Field label="Supplier / Party Name" value={form.supplier_name} onChange={v => setForm(f => ({ ...f, supplier_name: v }))} placeholder="Walk-in supplier name" />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Vehicle No." value={form.vehicle_number} onChange={v => setForm(f => ({ ...f, vehicle_number: v }))} placeholder="e.g. LHR-5432" />
                <Field label="Driver Name" value={form.driver_name} onChange={v => setForm(f => ({ ...f, driver_name: v }))} />
                <Field label="Driver CNIC" value={form.driver_cnic} onChange={v => setForm(f => ({ ...f, driver_cnic: v }))} placeholder="35201-XXXXXXX-X" />
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Received By" value={form.received_by} onChange={v => setForm(f => ({ ...f, received_by: v }))} />
                <Field label="Security Officer" value={form.security_officer} onChange={v => setForm(f => ({ ...f, security_officer: v }))} />
              </div>

              <Field label="Remarks" value={form.remarks} onChange={v => setForm(f => ({ ...f, remarks: v }))} />

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Material / Items</label>
                  <button type="button" onClick={addItemRow}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-violet-300 border border-violet-500/30 hover:border-violet-400/60 transition-all">
                    + Add Row
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {['Description *', 'Qty', 'Unit', 'Weight (Kg)', 'Remarks', ''].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-white/40 font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-t border-white/5">
                          <td className="px-2 py-2">
                            <input value={it.description} onChange={e => setItemField(idx, 'description', e.target.value)}
                              required className="w-full rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none min-w-[160px]"
                              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          </td>
                          {['quantity', 'unit', 'weight_kg', 'remarks'].map(k => (
                            <td key={k} className="px-2 py-2">
                              <input value={it[k]} onChange={e => setItemField(idx, k, e.target.value)}
                                type={['quantity', 'weight_kg'].includes(k) ? 'number' : 'text'}
                                step="0.001" min="0"
                                className="w-full rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeItemRow(idx)}
                                className="text-red-400/60 hover:text-red-400 transition-colors text-base">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/25 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  {saving ? 'Saving…' : editId ? 'Update Gate Pass' : 'Save Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder, readOnly }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} readOnly={readOnly} required={required} placeholder={placeholder}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all disabled:opacity-50"
        style={{ background: readOnly ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      />
    </div>
  )
}

function PrintView({ gp, onClose }) {
  useEffect(() => {
    window.print()
  }, [])

  const totalQty = gp.items?.reduce((s, i) => s + parseFloat(i.quantity || 0), 0) ?? 0
  const totalWt  = gp.items?.reduce((s, i) => s + parseFloat(i.weight_kg || 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print mb-6 flex gap-3">
        <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Print</button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-bold">Back</button>
      </div>

      <div className="max-w-3xl mx-auto border border-black">
        {/* Header */}
        <div className="border-b border-black p-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest">Inward Gate Pass</h1>
          <p className="text-xs text-gray-500 mt-0.5">Original Copy</p>
        </div>

        {/* Gate Pass Meta */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-4 border-r border-black space-y-1 text-sm">
            <Row label="Gate Pass No." value={gp.gate_pass_number} bold />
            <Row label="Date" value={gp.date} />
            <Row label="Time" value={gp.time} />
          </div>
          <div className="p-4 space-y-1 text-sm">
            <Row label="Status" value={gp.status?.toUpperCase()} />
            <Row label="PO Reference" value={gp.po_number || '—'} />
            <Row label="Received By" value={gp.received_by || '—'} />
          </div>
        </div>

        {/* Supplier / Vehicle */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-4 border-r border-black space-y-1 text-sm">
            <p className="text-xs font-bold uppercase text-gray-500 mb-2">Supplier / Party</p>
            <p className="font-bold">{gp.supplier_label || gp.supplier_name || '—'}</p>
          </div>
          <div className="p-4 space-y-1 text-sm">
            <p className="text-xs font-bold uppercase text-gray-500 mb-2">Vehicle Details</p>
            <Row label="Vehicle No." value={gp.vehicle_number || '—'} />
            <Row label="Driver" value={gp.driver_name || '—'} />
            <Row label="CNIC" value={gp.driver_cnic || '—'} />
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm border-b border-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="px-3 py-2.5 text-left font-bold border-r border-black">#</th>
              <th className="px-3 py-2.5 text-left font-bold border-r border-black">Description of Material</th>
              <th className="px-3 py-2.5 text-center font-bold border-r border-black">Qty</th>
              <th className="px-3 py-2.5 text-center font-bold border-r border-black">Unit</th>
              <th className="px-3 py-2.5 text-center font-bold border-r border-black">Weight (Kg)</th>
              <th className="px-3 py-2.5 text-left font-bold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(gp.items ?? []).map((it, idx) => (
              <tr key={it.id} className="border-b border-gray-200">
                <td className="px-3 py-2 border-r border-gray-200 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2 border-r border-gray-200 font-medium">{it.description}</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">{parseFloat(it.quantity).toLocaleString()}</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">{it.unit || '—'}</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">{parseFloat(it.weight_kg || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-gray-600">{it.remarks || '—'}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="bg-gray-50 font-bold border-t-2 border-black">
              <td colSpan={2} className="px-3 py-2 border-r border-black text-right">Total</td>
              <td className="px-3 py-2 border-r border-black text-center">{totalQty.toLocaleString()}</td>
              <td className="px-3 py-2 border-r border-black" />
              <td className="px-3 py-2 border-r border-black text-center">{totalWt.toFixed(2)}</td>
              <td />
            </tr>
          </tbody>
        </table>

        {/* Remarks */}
        {gp.remarks && (
          <div className="p-4 border-b border-black text-sm">
            <span className="font-bold">Remarks: </span>{gp.remarks}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 p-6">
          {['Security Officer', 'Store In-Charge', 'Received By'].map((sig, i) => (
            <div key={sig} className={`text-center text-sm ${i < 2 ? 'border-r border-black' : ''}`}>
              <div className="h-12 border-b border-dotted border-black mb-2" />
              <p className="font-bold text-xs uppercase">{sig}</p>
              {sig === 'Security Officer' && gp.security_officer && <p className="text-xs text-gray-500">{gp.security_officer}</p>}
              {sig === 'Received By' && gp.received_by && <p className="text-xs text-gray-500">{gp.received_by}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 min-w-[100px]">{label}:</span>
      <span className={bold ? 'font-bold' : 'font-medium'}>{value}</span>
    </div>
  )
}
