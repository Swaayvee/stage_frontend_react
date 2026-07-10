import { useState } from 'react'
import Card, { CardHeader } from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import {
  carriers,
  deliveries,
  formatDistance,
  internalCouriers,
  merchantActivity,
  recentDeliveries,
  weeklyStats,
} from '../data/deliveries'

function MerchantDashboard({ onNavigate }) {
  const pendingDeliveries = deliveries.filter((delivery) => delivery.needsAssignment)
  const [selectedPendingId, setSelectedPendingId] = useState(pendingDeliveries[0]?.id ?? null)
  const [handlingMode, setHandlingMode] = useState('carrier')
  const [selectedAssignee, setSelectedAssignee] = useState(null)

  const selectedPending = deliveries.find((delivery) => delivery.id === selectedPendingId)
  const assigneeOptions =
    selectedPending && handlingMode === 'internal'
      ? selectedPending.assignmentOptions.internal
      : selectedPending?.assignmentOptions.carrier ?? []

  const kpis = [
    { label: 'En cours', value: String(deliveries.filter((d) => d.status === 'En cours').length), detail: 'Livraisons actives', tone: 'text-[#8BA8FF]' },
    { label: 'Livrees ce mois', value: String(deliveries.filter((d) => d.status === 'Livre').length), detail: 'Sur les 30 derniers jours', tone: 'text-[#34D399]' },
    { label: 'En attente', value: String(deliveries.filter((d) => d.needsAssignment).length), detail: 'A affecter aujourd hui', tone: 'text-[#F59E0B]' },
    { label: 'Incidents', value: String(deliveries.filter((d) => d.status === 'Incident').length), detail: 'Necessitent action', tone: 'text-[#F87171]' },
  ]

  const quickActions = [
    { label: 'Nouvelle livraison', route: 'form', tone: 'from-[#6C8EFF]/22 to-[#A78BFA]/12 border-[#6C8EFF]/25 text-[#DDE6FF]' },
    { label: 'Affecter livreur', route: 'merchantAssign', tone: 'from-[#34D399]/18 to-[#6C8EFF]/10 border-[#34D399]/25 text-[#D8FFF0]' },
    { label: 'Point relais', route: 'merchantRelays', tone: 'from-[#F59E0B]/18 to-[#34D399]/10 border-[#F59E0B]/25 text-[#FFEAC2]' },
    { label: 'Rapport', route: 'merchantReport', tone: 'from-[#A78BFA]/20 to-[#6C8EFF]/10 border-[#A78BFA]/25 text-[#EEE7FF]' },
  ]

  const resolveAssigneeName = (option) => {
    const courier = internalCouriers.find((item) => item.id === option.id)
    if (courier) return courier.name
    return carriers.find((item) => item.id === option.id)?.name ?? option.id
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C8EFF]">Commercant</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Tableau de bord</h1>
          <p className="mt-2 text-sm text-slate-500">Suivi operationnel des livraisons de Mon Commerce.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('merchantReport')}
            className="rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-slate-300"
          >
            Exporter
          </button>
          <button
            onClick={() => onNavigate('form')}
            className="rounded-lg bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA] px-4 py-3 text-sm font-bold text-white"
          >
            Nouvelle livraison
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{kpi.label}</div>
            <div className={`mt-3 text-4xl font-extrabold ${kpi.tone}`}>{kpi.value}</div>
            <div className="mt-2 text-sm text-slate-500">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <Card className="overflow-hidden">
            <CardHeader title="Affectation par livraison" action="Tout affecter" onAction={() => onNavigate('merchantAssign')} />
            {pendingDeliveries.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">Toutes les livraisons sont affectees.</div>
            ) : (
              <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-3">
                  {pendingDeliveries.map((delivery) => (
                    <button
                      key={delivery.id}
                      onClick={() => {
                        setSelectedPendingId(delivery.id)
                        setSelectedAssignee(null)
                        setHandlingMode(delivery.distanceKm > 50 ? 'carrier' : 'internal')
                      }}
                      className={`rounded-lg border p-4 text-left transition ${
                        selectedPendingId === delivery.id
                          ? 'border-[#6C8EFF]/30 bg-[#6C8EFF]/10'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-[#8BA8FF]">{delivery.shortId}</span>
                        <StatusPill tone={delivery.tone}>{delivery.status}</StatusPill>
                      </div>
                      <div className="mt-2 font-bold">{delivery.customer}</div>
                      <div className="mt-1 text-xs text-slate-500">{delivery.address}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">{delivery.destinationLabel}</span>
                        <span className="rounded-full bg-[#F59E0B]/15 px-2 py-1 text-[#F59E0B]">
                          {formatDistance(delivery.distanceKm)} depuis le commerce
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedPending ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 text-sm font-bold">
                      Choisir la prise en charge pour {selectedPending.shortId}
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {[
                        { id: 'internal', title: 'Livreur interne' },
                        { id: 'carrier', title: 'Transporteur tiers' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setHandlingMode(option.id)
                            setSelectedAssignee(null)
                          }}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                            handlingMode === option.id
                              ? option.id === 'internal'
                                ? 'border-[#34D399]/30 bg-[#34D399]/10 text-[#B8F8DB]'
                                : 'border-[#A78BFA]/30 bg-[#A78BFA]/10 text-[#E7DCFF]'
                              : 'border-white/10 text-slate-400 hover:bg-white/[0.05]'
                          }`}
                        >
                          {option.title}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2">
                      {assigneeOptions.length === 0 ? (
                        <div className="rounded-lg border border-white/10 p-3 text-xs text-slate-500">
                          Aucun {handlingMode === 'internal' ? 'livreur interne' : 'transporteur'} disponible pour cette distance.
                        </div>
                      ) : (
                        assigneeOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedAssignee(option.id)}
                            className={`grid grid-cols-[1fr_auto] gap-3 rounded-lg border px-4 py-3 text-left ${
                              selectedAssignee === option.id
                                ? handlingMode === 'internal'
                                  ? 'border-[#34D399]/30 bg-[#34D399]/10'
                                  : 'border-[#A78BFA]/30 bg-[#A78BFA]/10'
                                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                            }`}
                          >
                            <span>
                              <span className="block text-sm font-bold">{resolveAssigneeName(option)}</span>
                              <span className="block text-xs text-slate-500">
                                {handlingMode === 'internal' ? 'Equipe interne' : 'Prestataire externe'}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block text-xs font-bold text-[#8BA8FF]">{formatDistance(option.distanceKm)}</span>
                              <span className="block text-[10px] text-slate-500">{option.eta}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    {selectedAssignee ? (
                      <div className="mt-4 rounded-lg border border-[#34D399]/20 bg-[#34D399]/10 p-3 text-xs text-[#B8F8DB]">
                        {resolveAssigneeName(assigneeOptions.find((o) => o.id === selectedAssignee))} sera affecte a{' '}
                        {selectedPending.shortId} ({handlingMode === 'internal' ? 'livreur interne' : 'transporteur tiers'}).
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Livraisons cette semaine" action="Voir details" onAction={() => onNavigate('merchantStats')} />
            <div className="flex h-56 items-end gap-3 p-5">
              {weeklyStats.map((stat) => (
                <div key={stat.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end gap-1">
                    <div className="flex-1 rounded-t bg-gradient-to-t from-[#6C8EFF]/30 to-[#6C8EFF]" style={{ height: stat.internal }} />
                    <div className="flex-1 rounded-t bg-gradient-to-t from-[#A78BFA]/30 to-[#A78BFA]" style={{ height: stat.external }} />
                  </div>
                  <div className="text-xs font-semibold text-slate-500">{stat.day}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-5 px-5 pb-5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#6C8EFF]" /> Livreur interne
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#A78BFA]" /> Transporteur tiers
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Livraisons recentes" action="Tout voir" onAction={() => onNavigate('merchantDeliveries')} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Ref</th>
                    <th className="px-5 py-3">Client / Adresse</th>
                    <th className="px-5 py-3">Type / Prise en charge</th>
                    <th className="px-5 py-3">Distance</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="transition hover:bg-white/[0.04]">
                      <td className="px-5 py-4 font-bold text-[#8BA8FF]">#{delivery.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold">{delivery.customer}</div>
                        <div className="mt-1 text-xs text-slate-500">{delivery.address}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-300">{delivery.destinationLabel}</div>
                        <div className="mt-1 text-xs text-slate-500">{delivery.handlingLabel}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{formatDistance(delivery.distanceKm)}</td>
                      <td className="px-5 py-4">
                        <StatusPill tone={delivery.tone}>{delivery.status}</StatusPill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => onNavigate('merchantTracking', delivery.id)} className="font-bold text-[#8BA8FF]">
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 self-start">
          <Card>
            <CardHeader title="Actions rapides" />
            <div className="grid grid-cols-2 gap-3 p-5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.route)}
                  className={`flex h-24 items-center justify-center rounded-lg border bg-gradient-to-br px-3 py-4 text-center text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${action.tone}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Activite recente" action="Tout voir" onAction={() => onNavigate('merchantActivity')} />
            <div className="divide-y divide-white/10">
              {merchantActivity.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onNavigate('merchantTracking', event.deliveryId)}
                  className="flex w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      event.tone === 'green'
                        ? 'bg-[#34D399]'
                        : event.tone === 'blue'
                          ? 'bg-[#6C8EFF]'
                          : event.tone === 'amber'
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#F87171]'
                    }`}
                  />
                  <div>
                    <div className="text-sm text-slate-300">{event.text}</div>
                    <div className="mt-1 text-xs text-slate-600">{event.time}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MerchantDashboard
