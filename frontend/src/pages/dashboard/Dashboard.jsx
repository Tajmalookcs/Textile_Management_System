import Layout from '../../components/Layout/Layout'

const stats = [
  { label: 'Total Products', value: '0', sub: '0 active this month',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>,
    gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)', shadow: 'rgba(124,58,237,0.35)' },
  { label: "Today's Sales", value: 'Rs 0', sub: '0 invoices today',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    gradient: 'linear-gradient(135deg,#059669,#0d9488)', shadow: 'rgba(5,150,105,0.35)' },
  { label: 'Pending Invoices', value: '0', sub: '0 overdue',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    gradient: 'linear-gradient(135deg,#d97706,#ea580c)', shadow: 'rgba(217,119,6,0.35)' },
  { label: 'Low Stock Items', value: '0', sub: '0 critical',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
    gradient: 'linear-gradient(135deg,#db2777,#9333ea)', shadow: 'rgba(219,39,119,0.35)' },
]

const actions = [
  { label: 'New Invoice',  path: '/invoices',   gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
  { label: 'Add Product',  path: '/products',   gradient: 'linear-gradient(135deg,#059669,#0d9488)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { label: 'Stock Entry',  path: '/inventory',  gradient: 'linear-gradient(135deg,#d97706,#ea580c)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { label: 'New Purchase', path: '/purchases',  gradient: 'linear-gradient(135deg,#db2777,#9333ea)',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
]

export default function Dashboard() {
  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative overflow-hidden px-8 pt-8 pb-10"
        style={{background:'linear-gradient(135deg,#0f0c29 0%,#302b63 60%,#24243e 100%)'}}>
        <div className="absolute inset-0 opacity-30"
          style={{backgroundImage:'radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 20%,#4f46e5 0%,transparent 50%)'}} />
        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{background:'linear-gradient(to bottom,transparent,#f4f5f9)'}} />
        <div className="relative z-10 animate-fadeIn">
          <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Overview</p>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-white/50 text-sm">Welcome back. Here's your mill at a glance.</p>
        </div>

        {/* Stat cards floating on header */}
        <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {stats.map((s, i) => (
            <div key={s.label} className="rounded-2xl p-5 card-hover animate-fadeIn"
              style={{ animationDelay:`${i*80}ms`, background:'rgba(255,255,255,0.07)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-white/60 text-xs font-medium leading-tight">{s.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{background:s.gradient, boxShadow:`0 4px 12px ${s.shadow}`}}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-white/35 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 animate-fadeIn">

        {/* Quick Actions */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map(a => (
              <a key={a.label} href={a.path}
                className="group relative rounded-2xl p-4 overflow-hidden card-hover cursor-pointer"
                style={{background:a.gradient, boxShadow:'0 4px 20px rgba(0,0,0,0.12)'}}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{background:'rgba(255,255,255,0.1)'}} />
                <div className="relative flex items-center gap-3 text-white">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    {a.icon}
                  </div>
                  <span className="font-semibold text-sm">{a.label}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Invoices */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Recent Invoices</h3>
                <p className="text-gray-400 text-xs mt-0.5">Last 10 sales tax invoices</p>
              </div>
              <a href="/invoices" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">View all →</a>
            </div>
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No invoices yet</p>
              <p className="text-xs text-gray-300 mt-1">Create your first sales tax invoice</p>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Low Stock */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 text-sm">Stock Alerts</h3>
                <p className="text-gray-400 text-xs mt-0.5">Items running low</p>
              </div>
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2">
                  <svg width="20" height="20" fill="none" stroke="#059669" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-400">All stock normal</p>
              </div>
            </div>

            {/* FBR Status */}
            <div className="rounded-2xl p-5 overflow-hidden relative"
              style={{background:'linear-gradient(135deg,#0f0c29,#302b63)'}}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{background:'radial-gradient(circle,#7c3aed,transparent)'}} />
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">FBR Integration</p>
              <p className="text-white font-bold text-sm mb-1">Not Configured</p>
              <p className="text-white/40 text-xs mb-4">Connect to PRAL API for digital invoicing</p>
              <a href="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors">
                Configure now →
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
