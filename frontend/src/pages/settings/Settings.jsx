import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

export default function Settings() {
  const [form, setForm] = useState({ name:'', address:'', phone:'', str_number:'', ntn_number:'', email:'', city:'' })
  const [logo, setLogo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text:'', type:'' })

  useEffect(() => {
    api.get('company/').then(r => {
      if (r.data.results?.length > 0 || r.data.length > 0) {
        const d = r.data.results?.[0] || r.data[0]
        setForm({ name:d.name||'', address:d.address||'', phone:d.phone||'', str_number:d.str_number||'', ntn_number:d.ntn_number||'', email:d.email||'', city:d.city||'' })
        if (d.logo) setPreview(d.logo)
      }
    }).catch(() => {})
  }, [])

  const handleSave = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k,v))
      if (logo) fd.append('logo', logo)
      await api.post('company/', fd)
      setMsg({ text: 'Settings saved successfully!', type: 'success' })
    } catch { setMsg({ text: 'Error saving settings.', type: 'error' }) }
    setSaving(false)
    setTimeout(() => setMsg({ text:'', type:'' }), 3000)
  }

  const Field = ({ label, name, type='text', ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={form[name]} onChange={e => setForm({...form,[name]:e.target.value})}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
        {...props} />
    </div>
  )

  return (
    <Layout>
      <div className="p-8 animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your company details for invoices and reports</p>
        </div>

        <div className="max-w-2xl">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-100" style={{background:'linear-gradient(135deg,#f5f3ff,#eef2ff)'}}>
              <p className="text-sm font-semibold text-gray-700 mb-4">Company Logo</p>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-violet-300 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                  {preview
                    ? <img src={preview} alt="logo" className="w-full h-full object-contain p-1" />
                    : <span className="text-3xl">🏭</span>}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors">
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){setLogo(f);setPreview(URL.createObjectURL(f))} }} />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB. Will appear on all invoices.</p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-5">
              <Field label="Company Name *" name="name" required placeholder="Ibrahim Textile Dyeing Ind." />
              <Field label="Address" name="address" placeholder="Satiana Road, Faisalabad" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" name="phone" placeholder="041-8717677" />
                <Field label="City" name="city" placeholder="Faisalabad" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="STR# (Sales Tax Reg.)" name="str_number" placeholder="04-05-3200-009-46" />
                <Field label="NTN#" name="ntn_number" placeholder="2212360-1" />
              </div>
              <Field label="Email" name="email" type="email" placeholder="info@company.com" />

              {msg.text && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.type==='success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {msg.text}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
