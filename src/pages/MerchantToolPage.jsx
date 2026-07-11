import { useState } from 'react'
import Card, { CardHeader } from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import MerchantBadge from '../components/merchant/MerchantBadge'
import AssignmentPanel from '../components/merchant/AssignmentPanel'
import Tag from '../components/ui/Tag'
import {
  deliveries,
  formatDistance,
  formatMerchantMode,
  merchantActivity,
  recentDeliveries,
  relayPoints,
  weeklyStats,
} from '../data/deliveries'

const pageContent = {
  merchantDeliveries: {
    eyebrow: 'Gestion',
    title: 'Toutes les livraisons',
    subtitle: 'Liste operationnelle alignee sur le tableau de bord : meme client, adresse, type et statut.',
  },
  merchantStats: {
    eyebrow: 'Statistiques',
    title: 'Performance des livraisons',
    subtitle: 'Repartition livreur interne vs transporteur tiers sur la semaine.',
  },
  merchantAssign: {
    eyebrow: 'Affectation',
    title: 'Affecter une prise en charge',
    subtitle: 'Pour chaque livraison, choisissez livreur interne ou transporteur tiers selon la distance.',
  },
  merchantRelays: {
    eyebrow: 'Points relais',
    title: 'Gestion des points relais',
    subtitle: 'Relais utilises dans les livraisons en cours et archivees.',
  },
  merchantReport: {
    eyebrow: 'Rapport',
    title: 'Export et rapport',
    subtitle: 'Synthese des livraisons, incidents et performances du commerce.',
  },
  merchantActivity: {
    eyebrow: 'Activite',
    title: 'Activite et notifications',
    subtitle: 'Evenements lies aux livraisons affichees dans le tableau de bord.',
  },
}

function MerchantToolPage({ view, onNavigate }) {
  const content = pageContent[view] ?? pageContent.merchantDeliveries

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C8EFF]">{content.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{content.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{content.subtitle}</p>
        </div>
        <button
          onClick={() => onNavigate('merchant')}
          className="rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-slate-300"
        >
          Retour dashboard
        </button>
      </div>

      {view === 'merchantDeliveries' ? <DeliveriesPage onNavigate={onNavigate} /> : null}
      {view === 'merchantStats' ? <StatsPage /> : null}
      {view === 'merchantAssign' ? <AssignPage onNavigate={onNavigate} /> : null}
      {view === 'merchantRelays' ? <RelaysPage /> : null}
      {view === 'merchantReport' ? <ReportPage /> : null}
      {view === 'merchantActivity' ? <ActivityPage onNavigate={onNavigate} /> : null}
    </div>
  )
}

function DeliveriesPage({ onNavigate }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Livraisons" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 text-left text-sm">
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
                <td className="px-5 py-4 font-bold text-[#8BA8FF]">{delivery.shortId}</td>
                <td className="px-5 py-4">
                  <div className="font-bold">{delivery.customer}</div>
                  <div className="mt-1 text-xs text-slate-500">{delivery.address}</div>
                  <div className="mt-2"><MerchantBadge merchantId={delivery.merchantId} size="sm" /></div>
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
                    Suivre
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function StatsPage() {
  const internalCount = deliveries.filter((d) => d.handlingType === 'internal').length
  const carrierCount = deliveries.filter((d) => d.handlingType === 'carrier').length
  const pendingCount = deliveries.filter((d) => d.needsAssignment).length

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <Card>
        <CardHeader title="Volumes hebdomadaires" />
        <div className="flex h-72 items-end gap-3 p-6">
          {weeklyStats.map((stat) => (
            <div key={stat.day} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-48 w-full items-end gap-1" title={`${stat.internal} internes · ${stat.external} transporteurs`}>
                <div className="flex-1 rounded-t bg-linear-to-t from-[#6C8EFF]/25 to-[#6C8EFF]" style={{ height: `${stat.internal * 15}px` }} />
                <div className="flex-1 rounded-t bg-linear-to-t from-[#A78BFA]/25 to-[#A78BFA]" style={{ height: `${stat.external * 15}px` }} />
              </div>
              <span className="text-xs font-bold text-slate-500">{stat.day} · {stat.internal + stat.external}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-5 px-6 pb-6 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-[#6C8EFF]" /> Livreur interne
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-[#A78BFA]" /> Transporteur tiers
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Repartition actuelle</div>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-3xl font-extrabold text-[#6C8EFF]">{internalCount}</div>
            <div className="text-sm text-slate-500">Livreur interne</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#A78BFA]">{carrierCount}</div>
            <div className="text-sm text-slate-500">Transporteur tiers</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#F59E0B]">{pendingCount}</div>
            <div className="text-sm text-slate-500">En attente d affectation</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AssignPage({ onNavigate }) {
  const pendingDeliveries = deliveries.filter((delivery) => delivery.needsAssignment)
  const [selectedId, setSelectedId] = useState(pendingDeliveries[0]?.id ?? null)
  const [handlingMode, setHandlingMode] = useState('carrier')
  const [selectedAssignee, setSelectedAssignee] = useState(null)
  const [validatedAssignments, setValidatedAssignments] = useState([])

  const selected = deliveries.find((delivery) => delivery.id === selectedId)
  const selectedIndex = pendingDeliveries.findIndex((delivery) => delivery.id === selectedId)

  const selectAt = (index) => {
    const delivery = pendingDeliveries[index]
    if (!delivery) return
    setSelectedId(delivery.id)
    setSelectedAssignee(null)
    setHandlingMode(delivery.distanceKm > 50 ? 'carrier' : 'internal')
  }

  if (pendingDeliveries.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-sm text-slate-400">Aucune livraison en attente d’affectation.</div>
        <button onClick={() => onNavigate('merchantDeliveries')} className="mt-4 text-sm font-bold text-[#8BA8FF]">
          Voir toutes les livraisons
        </button>
      </Card>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pendingDeliveries.map((delivery) => (
          <button
            key={delivery.id}
            onClick={() => {
              setSelectedId(delivery.id)
              setSelectedAssignee(null)
              setHandlingMode(delivery.distanceKm > 50 ? 'carrier' : 'internal')
            }}
            className={`rounded-lg border p-4 text-left transition ${
              selectedId === delivery.id
                ? 'border-[#6C8EFF]/30 bg-[#6C8EFF]/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
            }`}
          >
            <div className="font-bold text-[#8BA8FF]">{delivery.shortId}</div>
            <div className="mt-2 font-bold">{delivery.customer}</div>
            <div className="mt-1 text-xs text-slate-500">{delivery.destinationLabel}</div>
            <div className="mt-3 text-xs font-bold text-[#F59E0B]">{formatDistance(delivery.distanceKm)} depuis le commerce</div>
          </button>
        ))}
      </div>

      {selected ? (
        <Card className="overflow-hidden">
          <CardHeader
            title={`Affectation ${selected.shortId}`}
            action="Voir le suivi"
            onAction={() => onNavigate('merchantTracking', selected.id)}
          />
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div>
              <div className="text-sm font-bold">{selected.customer}</div>
              <div className="mt-1 text-sm text-slate-500">{selected.address}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.items.map((item) => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs"
                  >
                    <span className="text-base">{item.vignette}</span>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            <AssignmentPanel
              delivery={selected}
              handlingMode={handlingMode}
              selectedAssignee={selectedAssignee}
              onHandlingModeChange={(mode) => {
                setHandlingMode(mode)
                setSelectedAssignee(null)
              }}
              onAssigneeChange={setSelectedAssignee}
              onPrevious={() => selectAt(selectedIndex - 1)}
              onNext={() => selectAt(selectedIndex + 1)}
              hasPrevious={selectedIndex > 0}
              hasNext={selectedIndex < pendingDeliveries.length - 1}
              onValidate={() => setValidatedAssignments((current) => [...current, selectedId])}
              validated={validatedAssignments.includes(selectedId)}
            />
          </div>
        </Card>
      ) : null}
    </div>
  )
}

function RelaysPage() {
  const usedRelayIds = deliveries.filter((d) => d.relayId).map((d) => d.relayId)
  const usedRelays = relayPoints.filter((point) => usedRelayIds.includes(point.id))
  const otherRelays = relayPoints.filter((point) => !usedRelayIds.includes(point.id))

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader title="Relais utilises dans les livraisons" />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {usedRelays.map((point) => {
            const linked = deliveries.filter((d) => d.relayId === point.id)
            return (
              <div key={point.id} className="rounded-lg border border-[#34D399]/20 bg-[#34D399]/10 p-4">
                <div className="font-bold">{point.name}</div>
                <div className="mt-2 text-sm leading-5 text-slate-500">{point.address}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                  <Tag tone="green">{formatDistance(point.distanceKm)} du commerce</Tag>
                  <Tag>
                    {linked.map((d) => d.shortId).join(', ')}
                  </Tag>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Autres relais disponibles" />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {otherRelays.map((point) => (
            <div key={point.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="font-bold">{point.name}</div>
              <div className="mt-2 text-sm leading-5 text-slate-500">{point.address}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                <Tag tone="blue">{point.hint}</Tag>
                <Tag tone="green">{formatDistance(point.distanceKm)}</Tag>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ReportPage() {
  const delivered = deliveries.filter((d) => d.status === 'Livre').length
  const incidents = deliveries.filter((d) => d.status === 'Incident').length
  const pending = deliveries.filter((d) => d.needsAssignment).length

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card className="p-6">
        <div className="text-sm leading-6 text-slate-400">
          Synthese basee sur les {deliveries.length} livraisons du commerce. L export backend viendra plus tard ; les
          chiffres ci-dessous correspondent aux donnees affichees dans le tableau de bord.
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Livraisons', value: deliveries.length },
            { label: 'Incidents', value: incidents },
            { label: 'Performances', value: `${Math.round((delivered / deliveries.length) * 100)}%` },
          ].map((item) => (
            <button key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4 text-left">
              <div className="text-2xl font-extrabold text-[#8BA8FF]">{item.value}</div>
              <div className="mt-1 text-sm font-bold text-slate-300">{item.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Details</div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Livrees</span>
            <span className="font-bold">{delivered}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">En attente</span>
            <span className="font-bold">{pending}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Interne / Tiers</span>
            <span className="font-bold">
              {deliveries.filter((d) => d.handlingType === 'internal').length} /{' '}
              {deliveries.filter((d) => d.handlingType === 'carrier').length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ActivityPage({ onNavigate }) {
  return (
    <Card>
      <CardHeader title="Evenements recents" />
      <div className="divide-y divide-white/10">
        {merchantActivity.map((event) => {
          const delivery = deliveries.find((d) => d.id === event.deliveryId)
          return (
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
              <div className="flex-1">
                <div className="text-sm font-bold">{event.text}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {delivery ? `${delivery.customer} · ${formatMerchantMode(delivery)}` : event.time}
                </div>
                <div className="mt-1 text-xs text-slate-600">{event.time}</div>
              </div>
              <span className="text-xs font-bold text-[#8BA8FF]">Voir</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default MerchantToolPage
