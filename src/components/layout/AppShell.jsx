import { useState } from 'react'

const navItems = [
  { id: 'client', label: 'Accueil client', meta: 'Vue mobile et client', badge: null },
  { id: 'form', label: 'Nouvelle livraison', meta: 'Demande et mode', badge: null },
  { id: 'tracking', label: 'Suivi livraison', meta: 'Colis #042', badge: 'live' },
  { id: 'merchant', label: 'Tableau commerçant', meta: 'Pilotage', badge: '4' },
]

function AppShell({ children, currentView, selectedDeliveryId, onNavigate }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const activeView = currentView === 'merchantTracking' ? 'tracking' : currentView.startsWith('merchant') ? 'merchant' : currentView

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070C1A] text-slate-100">
      <div className="ambient-background" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-grid" />
      </div>

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen bg-transparent px-3 py-7 transition-all duration-300 lg:flex lg:flex-col ${
          sidebarCollapsed ? 'w-28 border-r-0 backdrop-blur-0' : 'w-64 border-r border-white/10 backdrop-blur-[2px]'
        }`}
      >
        <button
          className={`mb-8 px-3 text-left font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA] transition ${
            sidebarCollapsed ? 'text-2xl' : 'text-2xl'
          }`}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          title={sidebarCollapsed ? 'Deplier la sidebar' : 'Retracter la sidebar'}
        >
          App
        </button>

        <div
          className={`px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 ${
            sidebarCollapsed ? 'sr-only' : ''
          }`}
        >
          Principal
        </div>
        <nav className={`flex flex-1 flex-col gap-1 transition-opacity ${sidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          {navItems.map((item) => {
            const isTracking = item.id === 'tracking'
            const itemMeta = isTracking && (currentView === 'tracking' || currentView === 'merchantTracking') ? `Livraison #${selectedDeliveryId}` : item.meta

            return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`group rounded-lg px-3 py-3 text-left transition ${
                activeView === item.id
                  ? 'border border-[#6C8EFF]/25 bg-[#6C8EFF]/15 text-white shadow-[0_0_28px_rgba(108,142,255,0.14)]'
                  : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className={`text-sm font-bold ${sidebarCollapsed ? 'mx-auto' : ''}`}>
                  {sidebarCollapsed ? item.label.charAt(0) : item.label}
                </span>
                {item.badge && !sidebarCollapsed ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      item.badge === 'live' ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-[#6C8EFF] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {!sidebarCollapsed ? (
                <span className="mt-1 block text-xs text-slate-600 group-hover:text-slate-500">{itemMeta}</span>
              ) : null}
            </button>
            )
          })}
        </nav>

        <div className={`pt-4 ${sidebarCollapsed ? 'border-t-0' : 'border-t border-white/10'}`}>
          <div className={`rounded-lg p-3 transition ${sidebarCollapsed ? 'border border-transparent bg-transparent px-3' : 'border border-white/10 bg-white/[0.03]'}`}>
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-start' : ''}`}>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#6C8EFF] to-[#A78BFA] text-sm font-bold">
                M
              </div>
              <div className={`min-w-0 ${sidebarCollapsed ? 'hidden' : ''}`}>
                <div className="truncate text-sm font-bold">Mon Commerce</div>
                <div className="text-xs text-slate-500">Front livraison</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070C1A]/85 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA]"
            onClick={() => onNavigate('client')}
          >
            App
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#6C8EFF] to-[#A78BFA] text-sm font-bold">
            M
          </div>
        </div>
      </header>

      <main className={`relative z-10 pb-24 transition-all duration-300 lg:pb-0 ${sidebarCollapsed ? 'lg:pl-28' : 'lg:pl-64'}`}>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#070C1A]/90 p-2 backdrop-blur-2xl lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${
              activeView === item.id ? 'bg-[#6C8EFF]/20 text-[#8BA8FF]' : 'text-slate-500 hover:bg-white/[0.06]'
            }`}
          >
            {item.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default AppShell
