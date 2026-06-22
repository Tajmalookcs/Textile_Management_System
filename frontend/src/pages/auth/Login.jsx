import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

function DevCard({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#0d0b1e 0%,#1a1542 60%,#0f0c29 100%)', border: '2px solid rgba(79,70,229,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* top stars row */}
        <div className="flex justify-between px-6 pt-5 text-[#4f46e5]/40 text-xs tracking-[0.3em]">
          <span>✦</span><span>PROFESSIONAL WEB SOLUTIONS</span><span>✦</span>
        </div>

        {/* code icon */}
        <div className="flex justify-center mt-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        </div>

        {/* name */}
        <div className="text-center mt-5 px-6">
          <h2 className="text-4xl font-black tracking-[0.15em] text-white">ALAMGEER</h2>
          <div className="w-3/4 mx-auto h-px my-3" style={{ background: 'linear-gradient(90deg,transparent,#4f46e5,transparent)' }} />
          <p className="text-base font-bold tracking-[0.4em] text-[#818cf8]">DEVELOPERS</p>
        </div>

        {/* divider */}
        <div className="w-full h-px my-5" style={{ background: 'linear-gradient(90deg,transparent,rgba(79,70,229,0.4),transparent)' }} />

        {/* phone */}
        <div className="flex justify-center">
          <a href="tel:03046270546"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-lg tracking-widest transition-all hover:scale-105"
            style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)' }}>
            <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
            0304-6270546
          </a>
        </div>

        {/* footer */}
        <p className="text-center text-[9px] tracking-[0.25em] text-white/20 uppercase py-5">
          Built with Passion · Code with Purpose
        </p>

        {/* close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all text-lg">
          ×
        </button>
      </div>
    </div>
  )
}

const features = [
  { icon: '✓', text: 'FBR Sales Tax Invoice (SRO 288/2026)' },
  { icon: '✓', text: 'Production Batch Tracking' },
  { icon: '✓', text: 'Real-time Inventory Management' },
  { icon: '✓', text: 'Multi-role Access Control' },
  { icon: '✓', text: 'Dyeing · Weaving · Finishing · Printing' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState(null)
  const [showDev, setShowDev] = useState(false)

  useEffect(() => {
    axios.get('/api/company/').then(r => {
      const data = r.data
      const c = data.results?.[0] || data[0] || (Array.isArray(data) ? data[0] : data) || null
      if (c?.name) setCompany(c)
    }).catch(() => {})
  }, [])

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await login(form.username, form.password); navigate('/dashboard') }
    catch { setError('Invalid username or password') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#0a0818 0%,#1a1542 50%,#0f0c29 100%)'}}>
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{background:'radial-gradient(circle,#7c3aed,transparent)'}} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{background:'radial-gradient(circle,#4f46e5,transparent)'}} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-10" style={{background:'radial-gradient(circle,#0d9488,transparent)'}} />
      </div>

      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 relative z-10 animate-fadeIn">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl shadow-violet-500/40 flex-shrink-0"
              style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>
              {company?.logo
                ? <img src={company.logo} alt="logo" className="w-full h-full object-contain p-1" />
                : <span className="text-white font-black text-xl">{company?.name?.[0] || 'T'}</span>
              }
            </div>
            <span className="text-white font-bold text-lg tracking-tight">{company?.name || 'Textile MS'}</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
            Complete ERP<br />
            for <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(90deg,#a78bfa,#818cf8)'}}>Textile Mills</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-10">
            Manage your entire mill operation — from raw material to finished goods — with FBR-compliant digital invoicing built in.
          </p>

          <div className="space-y-3">
            {features.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>✓</div>
                <span className="text-white/65 text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50 text-xs">FBR PRAL API Ready · SRO 709(I)/2025</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm animate-fadeIn" style={{animationDelay:'150ms'}}>
          {/* Card */}
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
            style={{background:'rgba(255,255,255,0.05)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)'}}>

            {/* Card header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/8">
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>
                  {company?.logo
                    ? <img src={company.logo} alt="logo" className="w-full h-full object-contain p-0.5" />
                    : <span className="text-white font-black text-sm">{company?.name?.[0] || 'T'}</span>
                  }
                </div>
                <span className="text-white font-bold text-sm">{company?.name || 'Textile MS'}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
              <p className="text-white/40 text-sm">Enter your credentials to continue</p>
            </div>

            {/* Form */}
            <div className="px-8 py-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3 mb-5 animate-fadeIn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
                  <input type="text" value={form.username} required
                    onChange={e => setForm({...form, username:e.target.value})}
                    placeholder="Enter username"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                    style={{background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)'}}
                    onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                    onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                  <input type="password" value={form.password} required
                    onChange={e => setForm({...form, password:e.target.value})}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                    style={{background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)'}}
                    onFocus={e => e.target.style.border='1px solid rgba(124,58,237,0.6)'}
                    onBlur={e => e.target.style.border='1px solid rgba(255,255,255,0.12)'}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 mt-2 relative overflow-hidden group"
                  style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow:'0 8px 24px rgba(124,58,237,0.4)'}}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{background:'linear-gradient(135deg,#6d28d9,#4338ca)'}} />
                  <span className="relative">{loading ? 'Signing in...' : 'Sign In →'}</span>
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-white/20 text-xs mt-6">Textile Management System · v1.0.0</p>
          {/* Developer Tag */}
          {showDev && <DevCard onClose={() => setShowDev(false)} />}
          <div className="mt-4 flex justify-center">
            <div onClick={() => setShowDev(true)} className="cursor-pointer inline-flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-xl border border-[#4f46e5]/40 bg-[#0d0b1e]/60 backdrop-blur-sm hover:border-[#4f46e5]/80 hover:bg-[#1a1542]/60 transition-all hover:scale-105">
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#818cf8]/60 uppercase">Professional Web Solutions</span>
              <span className="text-sm font-black tracking-widest text-white/90">ALAMGEER</span>
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#818cf8]/70 uppercase">Developers</span>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#4f46e5]/60 to-transparent my-0.5" />
              <span className="text-[10px] font-semibold tracking-wider text-white/50">0304-6270546</span>
              <span className="text-[8px] tracking-[0.15em] text-white/25 uppercase mt-0.5">Built with Passion · Code with Purpose</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
