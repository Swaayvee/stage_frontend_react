import { useState } from 'react'
import AppShell from './components/layout/AppShell'
import ClientHome from './pages/ClientHome'
import DeliveryForm from './pages/DeliveryForm'
import DeliveryTracking from './pages/DeliveryTracking'
import MerchantDashboard from './pages/MerchantDashboard'
import MerchantToolPage from './pages/MerchantToolPage'

const views = {
  client: ClientHome,
  form: DeliveryForm,
  tracking: DeliveryTracking,
  merchantTracking: DeliveryTracking,
  merchant: MerchantDashboard,
  merchantDeliveries: MerchantToolPage,
  merchantStats: MerchantToolPage,
  merchantAssign: MerchantToolPage,
  merchantRelays: MerchantToolPage,
  merchantReport: MerchantToolPage,
  merchantActivity: MerchantToolPage,
}

function App() {
  const [view, setView] = useState('client')
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('042')
  const CurrentView = views[view]

  const navigate = (nextView, deliveryId) => {
    if (deliveryId) {
      setSelectedDeliveryId(deliveryId)
    }
    setView(nextView)
  }

  const perspective = view === 'merchantTracking' ? 'merchant' : view === 'tracking' ? 'client' : null

  return (
    <AppShell currentView={view} selectedDeliveryId={selectedDeliveryId} onNavigate={navigate}>
      <CurrentView
        onNavigate={navigate}
        view={view}
        perspective={perspective}
        selectedDeliveryId={selectedDeliveryId}
        onSelectDelivery={setSelectedDeliveryId}
      />
    </AppShell>
  )
}

export default App
