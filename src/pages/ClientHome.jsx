import Card, { CardHeader } from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import { deliveries, recentDeliveries } from '../data/deliveries'

function ClientHome({ onNavigate, selectedDeliveryId, onSelectDelivery }) {
  const currentDelivery = deliveries.find((delivery) => delivery.id === selectedDeliveryId) ?? deliveries[0]
  const activeDeliveries = deliveries.filter((delivery) => delivery.status !== 'Livre').length
  const deliveredCount = deliveries.filter((delivery) => delivery.status === 'Livre').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C8EFF]">Espace client</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Bonjour, Marie</h1>
          <p className="mt-2 text-sm text-slate-400">
            Vous avez {activeDeliveries} livraisons à surveiller et {deliveredCount} livraisons terminées.
          </p>
        </div>
        <button
          onClick={() => onNavigate('form')}
          className="rounded-lg bg-linear-to-r from-[#6C8EFF] to-[#A78BFA] px-5 py-3 text-sm font-bold text-white"
        >
          Nouvelle livraison
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 bg-linear-to-br from-[#6C8EFF]/15 to-[#A78BFA]/10 p-6">
            <StatusPill tone={currentDelivery.tone}>{currentDelivery.statusLabel}</StatusPill>
            <h2 className="mt-4 text-2xl font-extrabold">Suivi {currentDelivery.shortId}</h2>
            <p className="mt-2 text-sm text-slate-300">
              Commande {currentDelivery.order} — {currentDelivery.courier.shortName} est à environ{' '}
              {currentDelivery.courier.distance}
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#6C8EFF] to-[#A78BFA]"
                style={{ width: `${currentDelivery.progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Départ</span>
              <span>Chez vous</span>
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-xs text-slate-500">Arrivée estimée</p>
                <p className="text-3xl font-extrabold text-[#34D399]">{currentDelivery.eta}</p>
              </div>
              <button onClick={() => onNavigate('tracking', currentDelivery.id)} className="text-sm font-bold text-[#8BA8FF]">
                Suivre
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="p-6">
            <p className="text-sm text-slate-400">En cours</p>
            <p className="mt-2 text-4xl font-extrabold text-[#8BA8FF]">1</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-slate-400">Livrées</p>
            <p className="mt-2 text-4xl font-extrabold text-[#34D399]">8</p>
          </Card>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Mes livraisons" action="Tout voir" />
        <div className="divide-y divide-white/10">
          {recentDeliveries.slice(0, 3).map((delivery) => (
            <button
              key={delivery.id}
              onClick={() => {
                onSelectDelivery(delivery.id)
                onNavigate('tracking', delivery.id)
              }}
              className="grid w-full grid-cols-[1fr_auto] gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <div className="font-bold">Commande #{delivery.id}</div>
                <div className="mt-1 text-sm text-slate-500">{delivery.address}</div>
              </div>
              <StatusPill tone={delivery.tone}>{delivery.status}</StatusPill>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ClientHome
