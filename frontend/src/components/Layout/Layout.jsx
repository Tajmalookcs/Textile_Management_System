import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{background:'#f4f5f9'}}>
      <div className="sticky top-0 h-screen flex-shrink-0 shadow-2xl shadow-black/20 z-20">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col overflow-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
