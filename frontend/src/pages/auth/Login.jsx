import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-violet-500/40"
              style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>T</div>
            <span className="text-white font-bold text-lg tracking-tight">Textile MS</span>
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
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>T</div>
                <span className="text-white font-bold text-sm">Textile MS</span>
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
        </div>
      </div>
    </div>
  )
}
