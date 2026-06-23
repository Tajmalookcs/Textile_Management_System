import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const STATUS_COLORS = {
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const PURPOSE_COLORS = {
  sale:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  return:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  transfer: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  sample:   'bg-teal-500/20 text-teal-300 border-teal-500/30',
  other:    'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

const PURPOSES = [
  { value: 'sale',     label: 'Customer Sale / Delivery' },
  { value: 'return',   label: 'Return to Supplier' },
  { value: 'transfer', label: 'Internal Transfer' },
  { value: 'sample',   label: 'Sample / Demo' },
  { value: 'other',    label: 'Other' },
]

const EMPTY_ITEM = { description: '', quantity: '', unit: '', weight_kg: '', remarks: '' }

function today() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

const EMPTY_FORM = {
  gate_pass_number: '', date: today(), time: nowTime(),
  purpose: 'sale', customer: '', party_name: '', destination: '',
  vehicle_number: '', driver_name: '', driver_cnic: '',
  invoice_ref: '', dispatched_by: '', security_officer: '',
  remarks: '', status: 'pending',
}

export default function OutwardGatePass() {
  const [passes, setPasses]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('')
  const [filterPurpose, setFilterPurpose] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState(null)
  const [printId, setPrintId]     = useState(null)
  const [customers, setCustomers] = useState([])
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [items, setItems]         = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterPurpose) params.purpose = filterPurpose
      const r = await api.get('outward-gate-passes/', { params })
      setPasses(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterStatus, filterPurpose])

  useEffect(() => {
    api.get('customers/').then(r => setCustomers(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const openNew = async () => {
    const r = await api.get('outward-gate-passes/next_number/')
    setForm({ ...EMPTY_FORM, gate_pass_number: r.data.gate_pass_number, date: today(), time: nowTime() })
    setItems([{ ...EMPTY_ITEM }])
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (gp) => {
    setForm({
      gate_pass_number: gp.gate_pass_number, date: gp.date, time: gp.time,
      purpose: gp.purpose, customer: gp.customer ?? '', party_name: gp.party_name,
      destination: gp.destination, vehicle_number: gp.vehicle_number,
      driver_name: gp.driver_name, driver_cnic: gp.driver_cnic,
      invoice_ref: gp.invoice_ref, dispatched_by: gp.dispatched_by,
      security_officer: gp.security_officer, remarks: gp.remarks, status: gp.status,
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
      const payload = { ...form, customer: form.customer || null }
      let gp
      if (editId) {
        const r = await api.patch(`outward-gate-passes/${editId}/`, payload)
        gp = r.data
      } else {
        const r = await api.post('outward-gate-passes/', payload)
        gp = r.data
      }
      const existingIds = (gp.items ?? []).map(i => i.id)
      for (const item of items) {
        if (!item.description) continue
        const row = { gate_pass: gp.id, description: item.description, quantity: parseFloat(item.quantity) || 0, unit: item.unit, weight_kg: parseFloat(item.weight_kg) || 0, remarks: item.remarks }
        if (item.id) await api.patch(`outward-gate-pass-items/${item.id}/`, row)
        else await api.post('outward-gate-pass-items/', row)
      }
      for (const id of existingIds) {
        if (!items.find(i => i.id === id)) await api.delete(`outward-gate-pass-items/${id}/`)
      }
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (id, action) => {
    await api.post(`outward-gate-passes/${id}/${action}/`)
    load()
  }

  const setItemField = (idx, key, val) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  const addItemRow    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItemRow = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  const selectedGP = passes.find(p => p.id === printId)
  if (printId && selectedGP) return <PrintView gp={selectedGP} onClose={() => setPrintId(null)} />

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Outward Gate Pass</h1>
            <p className="text-white/40 text-sm mt-0.5">Record outgoing material to customers / transfers</p>
          </div>
          <button onClick={openNew}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 4px 16px rgba(13,148,136,0.4)' }}>
            + New Gate Pass
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gate pass #, party, vehicle, invoice..."
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
          <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">All Purpose</option>
            {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Gate Pass #', 'Date', 'Purpose', 'Customer / Party', 'Destination', 'Vehicle', 'Status', 'Items', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-white/30">Loading…</td></tr>
              ) : passes.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-white/20">No outward gate passes found.</td></tr>
              ) : passes.map(gp => (
                <tr key={gp.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-teal-300">{gp.gate_pass_number}</td>
                  <td className="px-4 py-3.5 text-white/70">{gp.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border capitalize ${PURPOSE_COLORS[gp.purpose] || PURPOSE_COLORS.other}`}>
                      {gp.purpose_display || gp.purpose}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-white/80">{gp.customer_label || gp.party_name || '—'}</td>
                  <td className="px-4 py-3.5 text-white/60 max-w-[140px] truncate">{gp.destination || '—'}</td>
                  <td className="px-4 py-3.5 text-white/60">{gp.vehicle_number || '—'}</td>
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
            style={{ background: 'linear-gradient(135deg,#0d0b1e,#1a1542)', border: '1px solid rgba(13,148,136,0.3)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-lg font-bold text-white">{editId ? 'Edit' : 'New'} Outward Gate Pass</h2>
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

              {/* Purpose */}
              <div>
                <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Purpose *</label>
                <div className="flex gap-2 flex-wrap">
                  {PURPOSES.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setForm(f => ({ ...f, purpose: p.value }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${form.purpose === p.value
                        ? 'bg-teal-600/40 border-teal-400/60 text-teal-200'
                        : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Customer (from list)</label>
                  <select value={form.customer} onChange={e => {
                    const c = customers.find(c => String(c.id) === e.target.value)
                    setForm(f => ({ ...f, customer: e.target.value, party_name: c?.name || f.party_name }))
                  }}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <option value="">— Select or type below —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field label="Customer / Party Name" value={form.party_name} onChange={v => setForm(f => ({ ...f, party_name: v }))} placeholder="Walk-in or free-text party" />
              </div>

              {/* Destination + Invoice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Destination / Address" value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))} placeholder="City / full address" />
                <Field label="Invoice / DO Reference" value={form.invoice_ref} onChange={v => setForm(f => ({ ...f, invoice_ref: v }))} placeholder="e.g. INV-00042" />
              </div>

              {/* Vehicle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Vehicle No." value={form.vehicle_number} onChange={v => setForm(f => ({ ...f, vehicle_number: v }))} placeholder="e.g. LHR-5432" />
                <Field label="Driver Name" value={form.driver_name} onChange={v => setForm(f => ({ ...f, driver_name: v }))} />
                <Field label="Driver CNIC" value={form.driver_cnic} onChange={v => setForm(f => ({ ...f, driver_cnic: v }))} placeholder="35201-XXXXXXX-X" />
              </div>

              {/* Officers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Dispatched By" value={form.dispatched_by} onChange={v => setForm(f => ({ ...f, dispatched_by: v }))} />
                <Field label="Security Officer" value={form.security_officer} onChange={v => setForm(f => ({ ...f, security_officer: v }))} />
              </div>

              <Field label="Remarks" value={form.remarks} onChange={v => setForm(f => ({ ...f, remarks: v }))} />

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Material / Items</label>
                  <button type="button" onClick={addItemRow}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-teal-300 border border-teal-500/30 hover:border-teal-400/60 transition-all">
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
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
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
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
        style={{ background: readOnly ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      />
    </div>
  )
}

function PrintView({ gp, onClose }) {
  useEffect(() => { window.print() }, [])

  const totalQty = gp.items?.reduce((s, i) => s + parseFloat(i.quantity || 0), 0) ?? 0
  const totalWt  = gp.items?.reduce((s, i) => s + parseFloat(i.weight_kg || 0), 0) ?? 0
  const purposeLabel = {
    sale: 'Customer Sale / Delivery', return: 'Return to Supplier',
    transfer: 'Internal Transfer', sample: 'Sample / Demo', other: 'Other',
  }[gp.purpose] || gp.purpose

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <style>{`@media print { body { margin: 0; } .no-print { display: none !important; } }`}</style>
      <div className="no-print mb-6 flex gap-3">
        <button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">Print</button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-bold">Back</button>
      </div>

      <div className="max-w-3xl mx-auto border border-black">
        {/* Header */}
        <div className="border-b border-black p-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest">Outward Gate Pass</h1>
          <p className="text-xs text-gray-500 mt-0.5">Original Copy</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-4 border-r border-black space-y-1 text-sm">
            <Row label="Gate Pass No." value={gp.gate_pass_number} bold />
            <Row label="Date" value={gp.date} />
            <Row label="Time" value={gp.time} />
          </div>
          <div className="p-4 space-y-1 text-sm">
            <Row label="Purpose" value={purposeLabel} />
            <Row label="Status" value={gp.status?.toUpperCase()} />
            <Row label="Invoice / DO Ref." value={gp.invoice_ref || '—'} />
          </div>
        </div>

        {/* Party / Vehicle */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-4 border-r border-black space-y-1 text-sm">
            <p className="text-xs font-bold uppercase text-gray-500 mb-2">Customer / Party</p>
            <p className="font-bold">{gp.customer_label || gp.party_name || '—'}</p>
            {gp.destination && <p className="text-gray-600 text-xs mt-1">{gp.destination}</p>}
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
            <tr className="bg-gray-50 font-bold border-t-2 border-black">
              <td colSpan={2} className="px-3 py-2 border-r border-black text-right">Total</td>
              <td className="px-3 py-2 border-r border-black text-center">{totalQty.toLocaleString()}</td>
              <td className="px-3 py-2 border-r border-black" />
              <td className="px-3 py-2 border-r border-black text-center">{totalWt.toFixed(2)}</td>
              <td />
            </tr>
          </tbody>
        </table>

        {gp.remarks && (
          <div className="p-4 border-b border-black text-sm">
            <span className="font-bold">Remarks: </span>{gp.remarks}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 p-6">
          {['Security Officer', 'Store Out-Charge', 'Dispatched By'].map((sig, i) => (
            <div key={sig} className={`text-center text-sm ${i < 2 ? 'border-r border-black' : ''}`}>
              <div className="h-12 border-b border-dotted border-black mb-2" />
              <p className="font-bold text-xs uppercase">{sig}</p>
              {sig === 'Security Officer' && gp.security_officer && <p className="text-xs text-gray-500">{gp.security_officer}</p>}
              {sig === 'Dispatched By' && gp.dispatched_by && <p className="text-xs text-gray-500">{gp.dispatched_by}</p>}
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
