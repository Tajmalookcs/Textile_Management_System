import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all bg-gray-50 hover:bg-white'
const lbl = 'block text-sm font-semibold text-gray-700 mb-1.5'
const readonlyInp = 'w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-default'

const TABS = ['Company', 'FBR / PRAL', 'Stock', 'System']

// ── Info box component ──
function InfoBox({ color, icon, children }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
  }
  return (
    <div className={`rounded-xl border px-4 py-3.5 text-sm ${colors[color]}`}>
      <div className="flex gap-2.5">
        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

function StepBadge({ n, done }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
      {done ? '✓' : n}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('Company')

  // Company form
  const [form, setForm] = useState({ name: '', address: '', phone: '', str_number: '', ntn_number: '', email: '', city: '', website: '' })
  const [companyId, setCompanyId] = useState(null)
  const [logo, setLogo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  // FBR form (stored locally — actual API keys go in backend .env)
  const [fbr, setFbr] = useState({ posId: '', username: '', password: '', posSerial: '', testMode: true })
  const [fbrSaved, setFbrSaved] = useState(false)

  // Stock settings
  const [stockSettings, setStockSettings] = useState({ autoDeductOnPaid: true, autoAddOnReceived: true, lowStockThreshold: 10 })

  useEffect(() => {
    api.get('company/').then(r => {
      const list = r.data?.results ?? r.data ?? []
      const d = Array.isArray(list) ? list[0] : list
      if (d?.id) {
        setCompanyId(d.id)
        setForm({ name: d.name || '', address: d.address || '', phone: d.phone || '', str_number: d.str_number || '', ntn_number: d.ntn_number || '', email: d.email || '', city: d.city || '', website: d.website || '' })
        if (d.logo) setPreview(d.logo)
      }
    }).catch(() => {})
    // Load FBR settings from localStorage (non-sensitive UI state only)
    const saved = localStorage.getItem('fbr_ui_settings')
    if (saved) { try { setFbr(JSON.parse(saved)); setFbrSaved(true) } catch {} }
    const ss = localStorage.getItem('stock_settings')
    if (ss) { try { setStockSettings(JSON.parse(ss)) } catch {} }
  }, [])

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 4000) }

  const handleSaveCompany = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (logo) fd.append('logo', logo)
      if (companyId) {
        await api.patch(`company/${companyId}/`, fd)
      } else {
        const res = await api.post('company/', fd)
        setCompanyId(res.data.id)
      }
      showMsg('Company settings saved successfully!')
    } catch { showMsg('Error saving settings.', 'error') }
    setSaving(false)
  }

  const handleSaveFBR = () => {
    localStorage.setItem('fbr_ui_settings', JSON.stringify(fbr))
    setFbrSaved(true)
    showMsg('FBR configuration saved. Remember to add API credentials to your backend .env file.')
  }

  const handleSaveStock = () => {
    localStorage.setItem('stock_settings', JSON.stringify(stockSettings))
    showMsg('Stock settings saved.')
  }

  const hasCompanyInfo = form.name && form.str_number && form.ntn_number
  const hasFbrConfig   = fbr.posId && fbr.username

  const MsgBox = () => msg.text ? (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
    </div>
  ) : null

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9]">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10"
          style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#4f46e5 0%,transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to bottom,transparent,#f4f5f9)' }} />
          <div className="relative z-10">
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Configuration</p>
            <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
            <p className="text-white/50 text-sm">Company details, FBR integration, stock rules</p>
          </div>

          {/* Setup health */}
          <div className="relative z-10 flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Company Info', done: !!hasCompanyInfo },
              { label: 'STR / NTN',   done: !!(form.str_number && form.ntn_number) },
              { label: 'FBR Config',  done: hasFbrConfig },
              { label: 'Logo',        done: !!preview },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs"
                style={{ color: s.done ? '#6ee7b7' : 'rgba(255,255,255,0.35)' }}>
                <span>{s.done ? '●' : '○'}</span> {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit mb-6">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                style={tab === t ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                {t}
              </button>
            ))}
          </div>

          <MsgBox />

          {/* ══ COMPANY TAB ══ */}
          {tab === 'Company' && (
            <div className="max-w-2xl space-y-5">
              <form onSubmit={handleSaveCompany}>
                <Section title="Company Logo" sub="Appears on all printed invoices">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-violet-300 flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm">
                      {preview ? <img src={preview} alt="logo" className="w-full h-full object-contain p-1" /> : <span className="text-3xl">🏭</span>}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                        Upload Logo
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files[0]; if (f) { setLogo(f); setPreview(URL.createObjectURL(f)) } }} />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">PNG or JPG, max 2MB. White background recommended.</p>
                    </div>
                  </div>
                </Section>

                <div className="mt-5">
                  <Section title="Business Information" sub="Used on all FBR-compliant invoices">
                    <div>
                      <label className={lbl}>Company Name <span className="text-red-500">*</span></label>
                      <input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ibrahim Textile Dyeing Ind." />
                    </div>
                    <div>
                      <label className={lbl}>Address</label>
                      <input className={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Satiana Road, Faisalabad" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Phone</label>
                        <input className={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="041-8717677" />
                      </div>
                      <div>
                        <label className={lbl}>City</label>
                        <input className={inp} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Faisalabad" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>STR# (Sales Tax Registration) <span className="text-red-500">*</span></label>
                        <input className={inp} value={form.str_number} onChange={e => setForm({ ...form, str_number: e.target.value })} placeholder="04-05-3200-009-46" />
                      </div>
                      <div>
                        <label className={lbl}>NTN# <span className="text-red-500">*</span></label>
                        <input className={inp} value={form.ntn_number} onChange={e => setForm({ ...form, ntn_number: e.target.value })} placeholder="2212360-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Email</label>
                        <input type="email" className={inp} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@company.com" />
                      </div>
                      <div>
                        <label className={lbl}>Website</label>
                        <input className={inp} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.example.com" />
                      </div>
                    </div>

                    <button type="submit" disabled={saving}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 mt-2"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      {saving ? 'Saving…' : 'Save Company Settings'}
                    </button>
                  </Section>
                </div>
              </form>
            </div>
          )}

          {/* ══ FBR / PRAL TAB ══ */}
          {tab === 'FBR / PRAL' && (
            <div className="max-w-3xl space-y-5">

              {/* What is FBR integration */}
              <Section title="📋 What is FBR e-Invoice Integration?" sub="Read this before configuring">
                <InfoBox color="blue" icon="ℹ️">
                  <p className="font-semibold">FBR (Federal Board of Revenue) requires registered businesses to submit Sales Tax Invoices electronically through PRAL (Pakistan Revenue Automation Ltd.).</p>
                  <p className="mt-1.5">Once integrated, every invoice you mark as <strong>Issued</strong> in this system gets automatically sent to FBR's server. FBR validates it and returns a <strong>verification number + QR code</strong> that must be printed on the invoice.</p>
                </InfoBox>

                <InfoBox color="amber" icon="📤">
                  <p className="font-semibold">What this system sends to FBR — per invoice:</p>
                  <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-xs">
                    <li>Your STR# and NTN# (seller identity)</li>
                    <li>Buyer name, address, NTN, STR# (if registered)</li>
                    <li>Invoice number and date</li>
                    <li>Each line item: HS/PCT code, description, quantity, unit price</li>
                    <li>Value excluding tax, sales tax rate (18%), tax amount, total</li>
                    <li>Grand totals (excl. tax + tax + incl. tax)</li>
                  </ul>
                  <p className="mt-1.5 text-xs"><strong>Nothing else is sent</strong> — FBR does not receive stock levels, purchase orders, production data, or salaries.</p>
                </InfoBox>

                <InfoBox color="green" icon="✅">
                  <p className="font-semibold">What you get back from FBR:</p>
                  <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-xs">
                    <li>A unique <strong>FBR Invoice Reference Number (IRN)</strong></li>
                    <li>A <strong>QR code</strong> for the customer to verify the invoice is genuine</li>
                    <li>Confirmation the invoice is recorded in FBR's system</li>
                  </ul>
                </InfoBox>
              </Section>

              {/* Step by step setup guide */}
              <Section title="🗺️ Integration Roadmap" sub="Complete these steps in order at the client site">
                <div className="space-y-4">
                  {[
                    {
                      n: 1, title: 'Verify FBR Registration',
                      desc: 'Confirm the business is registered on FBR\'s Iris portal (iris.fbr.gov.pk) and has an active STR#. The STR# format is: XX-XX-XXXX-XXX-XX (e.g. 04-05-3200-009-46).',
                      tip: 'Without a valid STR#, FBR will reject every submission.',
                    },
                    {
                      n: 2, title: 'Register POS / e-Invoice on PRAL',
                      desc: 'Log into the PRAL Integrated Tax Management System (ITMS). Go to e-Invoice → Register Business. Obtain a POS ID, API Username, API Password, and POS Serial Number.',
                      tip: 'PRAL helpline: 051-111-772-527. Ask for "e-Invoice API credentials".',
                    },
                    {
                      n: 3, title: 'Test in Sandbox First',
                      desc: 'PRAL provides a sandbox (test) environment. Submit 2–3 dummy invoices and verify you receive IRN numbers back. Only switch to Live after successful tests.',
                      tip: 'Keep "Test Mode" ON in the settings below until sandbox testing passes.',
                    },
                    {
                      n: 4, title: 'Enter Credentials Below',
                      desc: 'Enter your POS ID, API Username, Password, and POS Serial in the configuration section below. These get stored in the server\'s .env file — never in the database.',
                      tip: 'Never share these credentials. They are equivalent to your FBR login.',
                    },
                    {
                      n: 5, title: 'Enter Company STR# and NTN# in Company Tab',
                      desc: 'Go to the Company tab and make sure STR# and NTN# are filled correctly. These are included in every submission to FBR.',
                      tip: null,
                    },
                    {
                      n: 6, title: 'Go Live',
                      desc: 'Switch Test Mode OFF below. From this point, every invoice you issue will be submitted to FBR in real-time. The IRN and QR code will appear on the printed invoice.',
                      tip: 'Do a final test with one real invoice on go-live day before normal operations.',
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-4">
                      <StepBadge n={step.n} done={false} />
                      <div className="flex-1 pb-4 border-b border-gray-50 last:border-0">
                        <p className="text-sm font-bold text-gray-800">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                        {step.tip && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                            💡 {step.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* PRAL API Configuration */}
              <Section title="🔐 PRAL API Credentials" sub="Obtained from PRAL ITMS portal after POS registration">
                <InfoBox color="violet" icon="🔒">
                  <p>These credentials are stored in the backend <code className="bg-violet-100 px-1 rounded text-xs">.env</code> file on the server — not in the database. The UI below saves your reference only. Your developer must add the actual values to the server environment.</p>
                </InfoBox>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className={lbl}>POS ID <span className="text-red-500">*</span></label>
                    <input className={inp} value={fbr.posId} onChange={e => setFbr({ ...fbr, posId: e.target.value })} placeholder="From PRAL portal" />
                    <p className="text-xs text-gray-400 mt-1">Assigned when you register your POS system on PRAL.</p>
                  </div>
                  <div>
                    <label className={lbl}>POS Serial Number</label>
                    <input className={inp} value={fbr.posSerial} onChange={e => setFbr({ ...fbr, posSerial: e.target.value })} placeholder="Device/system serial" />
                  </div>
                  <div>
                    <label className={lbl}>API Username <span className="text-red-500">*</span></label>
                    <input className={inp} value={fbr.username} onChange={e => setFbr({ ...fbr, username: e.target.value })} placeholder="PRAL API username" />
                  </div>
                  <div>
                    <label className={lbl}>API Password <span className="text-red-500">*</span></label>
                    <input type="password" className={inp} value={fbr.password} onChange={e => setFbr({ ...fbr, password: e.target.value })} placeholder="PRAL API password" />
                  </div>
                </div>

                {/* Test/Live toggle */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Mode: {fbr.testMode ? '🧪 Test (Sandbox)' : '🟢 Live (Production)'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fbr.testMode ? 'Invoices are submitted to PRAL\'s sandbox — no real tax effect.' : 'Invoices are submitted to FBR in real-time. Tax records are created.'}</p>
                  </div>
                  <button type="button"
                    onClick={() => setFbr({ ...fbr, testMode: !fbr.testMode })}
                    className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${fbr.testMode ? 'bg-amber-400' : 'bg-emerald-500'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${fbr.testMode ? 'translate-x-0' : 'translate-x-7'}`} />
                  </button>
                </div>

                <button onClick={handleSaveFBR}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  Save FBR Configuration
                </button>

                {fbrSaved && (
                  <InfoBox color="amber" icon="⚠️">
                    <p className="font-semibold">Next step for your developer:</p>
                    <p className="mt-1 text-xs">Add these values to the server's <code className="bg-amber-100 px-1 rounded">.env</code> file:</p>
                    <pre className="mt-2 text-xs bg-amber-100 rounded-lg p-3 font-mono overflow-x-auto">{`PRAL_POS_ID=${fbr.posId || 'your_pos_id'}
PRAL_USERNAME=${fbr.username || 'your_username'}
PRAL_PASSWORD=your_actual_password
PRAL_POS_SERIAL=${fbr.posSerial || 'your_serial'}
PRAL_ENV=${fbr.testMode ? 'sandbox' : 'production'}`}</pre>
                  </InfoBox>
                )}
              </Section>

              {/* PRAL endpoints reference */}
              <Section title="🌐 PRAL API Endpoints Reference" sub="For your developer — official PRAL integration URLs">
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Sandbox (Testing)',    url: 'https://esp.fbr.gov.pk:8244/ESB/v1/invoice' },
                    { label: 'Production (Live)',    url: 'https://esp.fbr.gov.pk:8244/ESB/v1/invoice' },
                    { label: 'Token/Auth',           url: 'https://esp.fbr.gov.pk:8244/ESB/v1/auth/token' },
                    { label: 'PRAL ITMS Portal',     url: 'https://itms.fbr.gov.pk' },
                    { label: 'FBR Iris Portal',      url: 'https://iris.fbr.gov.pk' },
                    { label: 'FBR e-Invoice Guide',  url: 'https://www.fbr.gov.pk/einvoicing' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <p className="text-xs font-semibold text-gray-600 w-44 flex-shrink-0">{r.label}</p>
                      <code className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-1.5 flex-1 overflow-x-auto">{r.url}</code>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ══ STOCK TAB ══ */}
          {tab === 'Stock' && (
            <div className="max-w-2xl space-y-5">
              <Section title="⚙️ Automatic Stock Rules" sub="Control when stock is automatically updated">
                <InfoBox color="blue" icon="ℹ️">
                  <p>These rules run automatically on the backend when invoice or purchase order statuses change — no manual action needed.</p>
                </InfoBox>

                <div className="space-y-4 mt-2">
                  {/* Auto deduct */}
                  <div className="flex items-start justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-bold text-gray-800">Auto-deduct stock on Invoice → Paid</p>
                      <p className="text-xs text-gray-500 mt-1">When an invoice status changes to <strong>Paid</strong>, quantities are automatically deducted from the default warehouse stock. A Stock Transaction (OUT) record is created for audit trail.</p>
                      <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Already active in backend</p>
                    </div>
                    <button type="button"
                      onClick={() => setStockSettings(s => ({ ...s, autoDeductOnPaid: !s.autoDeductOnPaid }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${stockSettings.autoDeductOnPaid ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${stockSettings.autoDeductOnPaid ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Auto add */}
                  <div className="flex items-start justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-bold text-gray-800">Auto-add stock on Purchase Order → Received</p>
                      <p className="text-xs text-gray-500 mt-1">When a purchase order is marked <strong>Received</strong>, all item quantities are automatically added to the default warehouse stock. A Stock Transaction (IN) record is created.</p>
                      <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Already active in backend</p>
                    </div>
                    <button type="button"
                      onClick={() => setStockSettings(s => ({ ...s, autoAddOnReceived: !s.autoAddOnReceived }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${stockSettings.autoAddOnReceived ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${stockSettings.autoAddOnReceived ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Low stock threshold */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-bold text-gray-800 mb-1">Low Stock Alert Threshold</p>
                    <p className="text-xs text-gray-500 mb-3">Dashboard will show a warning for items at or below this quantity.</p>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" max="1000"
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-center font-bold"
                        value={stockSettings.lowStockThreshold}
                        onChange={e => setStockSettings(s => ({ ...s, lowStockThreshold: parseInt(e.target.value) || 0 }))} />
                      <span className="text-sm text-gray-500">units</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveStock}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  Save Stock Settings
                </button>
              </Section>

              {/* Stock flow diagram */}
              <Section title="📦 Stock Flow Overview" sub="How stock moves through the system">
                <div className="space-y-3 text-sm">
                  {[
                    { from: 'Purchase Order → Received', arrow: '→', to: 'Stock IN  (+qty)', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { from: 'Invoice → Paid',            arrow: '→', to: 'Stock OUT (−qty)', color: 'text-red-600',     bg: 'bg-red-50' },
                    { from: 'Manual Entry',              arrow: '→', to: 'Stock IN / OUT / Adjust', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { from: 'Production Batch Output',   arrow: '→', to: 'Manual stock entry needed', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map(r => (
                    <div key={r.from} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${r.bg}`}>
                      <p className="text-xs text-gray-600 flex-1">{r.from}</p>
                      <span className="text-gray-400 text-xs">{r.arrow}</span>
                      <p className={`text-xs font-bold ${r.color} w-48 text-right`}>{r.to}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ══ SYSTEM TAB ══ */}
          {tab === 'System' && (
            <div className="max-w-2xl space-y-5">
              <Section title="🖥️ System Information" sub="Read-only — for support and diagnostics">
                <div className="space-y-3">
                  {[
                    { label: 'System',          val: 'Textile Management System' },
                    { label: 'Version',         val: '1.0.0' },
                    { label: 'Backend',         val: 'Django 4+ / Django REST Framework' },
                    { label: 'Frontend',        val: 'React 19 / Vite / Tailwind CSS v4' },
                    { label: 'Auth',            val: 'JWT (SimpleJWT) — 1-day access / 7-day refresh' },
                    { label: 'Database',        val: 'SQLite (dev) / PostgreSQL recommended for production' },
                    { label: 'FBR Integration', val: 'PRAL e-Invoice API (requires setup)' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">{r.label}</p>
                      <p className="text-sm text-gray-800">{r.val}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="🏁 Installation Checklist" sub="Complete this before going live at client site">
                <div className="space-y-3">
                  {[
                    { task: 'Set company name, address, STR#, NTN# in Company tab',   where: 'Settings → Company' },
                    { task: 'Upload company logo',                                      where: 'Settings → Company' },
                    { task: 'Create at least one warehouse in Inventory',              where: 'Inventory page' },
                    { task: 'Add products and PCT codes',                              where: 'Products page' },
                    { task: 'Create user accounts for staff with correct roles',       where: 'Users page' },
                    { task: 'Enter PRAL API credentials in server .env file',         where: 'Settings → FBR / PRAL' },
                    { task: 'Test invoice creation and print',                         where: 'Invoices page' },
                    { task: 'Verify stock deduction works on invoice payment',         where: 'Inventory page' },
                    { task: 'Switch PRAL mode from Test to Live',                     where: 'Settings → FBR / PRAL' },
                    { task: 'Change Django SECRET_KEY in production .env',            where: 'Server config' },
                    { task: 'Set DEBUG=False in production .env',                     where: 'Server config' },
                    { task: 'Switch to PostgreSQL for production database',           where: 'Server config' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-5 h-5 rounded border-2 border-gray-200 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{r.task}</p>
                        <p className="text-xs text-violet-500 mt-0.5">{r.where}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="📞 Support Contacts" sub="For FBR and PRAL-related issues">
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'PRAL Helpline',      val: '051-111-772-527',              note: 'For e-invoice API issues' },
                    { label: 'FBR Helpline',       val: '051-111-772-372',              note: 'For STR / NTN registration' },
                    { label: 'FBR Iris Portal',    val: 'iris.fbr.gov.pk',             note: 'Login to manage your tax profile' },
                    { label: 'PRAL ITMS Portal',   val: 'itms.fbr.gov.pk',             note: 'Manage POS and e-invoice settings' },
                    { label: 'FBR e-Invoice Guide', val: 'fbr.gov.pk/einvoicing',      note: 'Official documentation' },
                  ].map(r => (
                    <div key={r.label} className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
                      <p className="text-xs font-bold text-gray-500 w-36 flex-shrink-0 mt-0.5">{r.label}</p>
                      <div>
                        <p className="text-sm font-semibold text-violet-700">{r.val}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
