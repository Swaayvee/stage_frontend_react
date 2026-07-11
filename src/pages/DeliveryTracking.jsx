import { useMemo, useState } from 'react'
import Card, { CardHeader } from '../components/ui/Card'
import ProgressSteps from '../components/delivery/ProgressSteps'
import DeliveryTimeline from '../components/delivery/DeliveryTimeline'
import StatusPill from '../components/ui/StatusPill'
import MerchantBadge from '../components/merchant/MerchantBadge'
import { deliveries, formatDistance } from '../data/deliveries'

const stepCopy = {
  created: 'Créée',
  validated: 'Validée',
  assigned: 'Affectée',
  notified: 'Notifiée',
  transit: 'Transit',
  received: 'Livree',
}

function compactProgressSteps(delivery) {
  const keySteps = delivery.trackingSteps.filter((step) =>
    ['validated', 'assigned', 'transit', 'received'].includes(step.id),
  )

  return keySteps.map((step, index) => ({
    label: stepCopy[step.id],
    time: step.status === 'active' ? 'Maintenant' : step.time.replace("Aujourd'hui - ", ''),
    icon: String(index + 1),
    status: step.status,
  }))
}

function DeliveryItems({ items }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
        >
          <div
            className="grid h-10 w-10 place-items-center rounded-lg text-lg"
            style={{ backgroundColor: `${item.color}22` }}
          >
            {item.vignette}
          </div>
          <div>
            <div className="text-sm font-bold">{item.name}</div>
            <div className="text-xs text-slate-500">Qté {item.quantity}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DeliveryTracking({ onNavigate, selectedDeliveryId, onSelectDelivery, perspective = 'client' }) {
  const isMerchant = perspective === 'merchant'
  const [deliveryFilter, setDeliveryFilter] = useState('active')
  const filteredDeliveries = useMemo(() => {
    if (deliveryFilter === 'active') {
      return deliveries.filter((delivery) => delivery.status !== 'Livre')
    }
    if (deliveryFilter === 'recent') {
      return deliveries.filter((delivery) => delivery.status === 'Livre' && delivery.completedDaysAgo <= 10)
    }
    return deliveries
  }, [deliveryFilter])
  const currentDelivery = deliveries.find((delivery) => delivery.id === selectedDeliveryId) ?? deliveries[0]
  const activeStep =
    currentDelivery.trackingSteps.find((step) => step.status === 'active') ??
    [...currentDelivery.trackingSteps].reverse().find((step) => step.status === 'done') ??
    currentDelivery.trackingSteps[0]
  const canConfirm = currentDelivery.status === 'Livre'

  const detailRows = isMerchant
    ? [
        ['Colis', currentDelivery.fullId],
        ['Client', currentDelivery.customer],
        ['Destination', currentDelivery.address],
        ['Type livraison', currentDelivery.destinationLabel],
        ['Prise en charge', currentDelivery.handlingLabel],
        ['Distance', formatDistance(currentDelivery.distanceKm)],
        ['Intervenant', `${currentDelivery.courier.shortName} - ${currentDelivery.courier.rating}`],
        ['Commercant', currentDelivery.merchant],
        ['Délai', currentDelivery.eta],
      ]
    : [
        ['Colis', currentDelivery.fullId],
        ['Client', currentDelivery.customer],
        ['Destination', currentDelivery.address],
        ['Intervenant', `${currentDelivery.courier.shortName} - ${currentDelivery.courier.rating}`],
        ['Commercant', currentDelivery.merchant],
        ['Délai', currentDelivery.eta],
      ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <StatusPill tone={currentDelivery.tone}>
            {currentDelivery.statusLabel} — Mise à jour {currentDelivery.updatedAt}
          </StatusPill>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            {isMerchant ? 'Suivi commerçant' : 'Suivi de livraison'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Livraison {currentDelivery.fullId} - Commande {currentDelivery.order}
          </p>
          <div className="mt-3">
            <MerchantBadge merchantId={currentDelivery.merchantId} />
          </div>
        </div>

        <Card className="p-3">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Livraison à suivre
          </label>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-white/[0.035] p-1">
            {[
              ['active', 'En cours'],
              ['recent', '10 jours'],
              ['history', 'Historique'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setDeliveryFilter(id)
                  const nextDelivery =
                    id === 'active'
                      ? deliveries.find((delivery) => delivery.status !== 'Livre')
                      : id === 'recent'
                        ? deliveries.find((delivery) => delivery.status === 'Livre' && delivery.completedDaysAgo <= 10)
                        : currentDelivery
                  if (nextDelivery) {
                    onSelectDelivery(nextDelivery.id)
                  }
                }}
                className={`rounded-md px-2 py-2 text-[11px] font-bold transition ${
                  deliveryFilter === id ? 'bg-[#6C8EFF]/20 text-[#9EB3FF]' : 'text-slate-500 hover:bg-white/[0.05]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={currentDelivery.id}
            onChange={(event) => onSelectDelivery(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-bold text-slate-100 outline-none focus:border-[#6C8EFF]"
          >
            {filteredDeliveries.map((delivery) => (
              <option key={delivery.id} value={delivery.id} className="bg-[#0B1020]">
                {delivery.shortId} - {delivery.customer} - {delivery.status}
              </option>
            ))}
          </select>
        </Card>
      </div>

      <div className="mb-6 rounded-lg border border-[#34D399]/20 bg-[#34D399]/10 px-5 py-4 text-sm text-[#9AF0C8]">
        Notification active — le système vous informe par e-mail et SMS à chaque changement de statut.
      </div>

      <ProgressSteps steps={compactProgressSteps(currentDelivery)} />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <Card>
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[#6C8EFF]/30 bg-[#6C8EFF]/15 text-base font-extrabold text-[#8BA8FF] shadow-[0_0_0_7px_rgba(108,142,255,0.08)]">
                {currentDelivery.progress}%
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#8BA8FF]">{activeStep.title}</div>
                <div className="mt-1 text-sm text-slate-500">{activeStep.description}</div>
              </div>
              <div className="text-2xl font-extrabold text-[#34D399]">{currentDelivery.eta}</div>
            </div>
            <div className="p-5">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6C8EFF] via-[#A78BFA] to-[#34D399]"
                  style={{ width: `${currentDelivery.progress}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {isMerchant
                  ? 'Vue opérationnelle pour le commerçant : type de livraison, prise en charge et contenu du colis.'
                  : 'Le suivi affiche l’état réel de cette livraison. Changez de colis dans le sélecteur pour consulter son parcours.'}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Contenu du colis" />
            <div className="p-5">
              <DeliveryItems items={currentDelivery.items} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Historique de la livraison" />
            <div className="p-5">
              <DeliveryTimeline steps={currentDelivery.trackingSteps} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 self-start">
          <Card>
            <CardHeader title="Details" />
            <div className="divide-y divide-white/10 p-5">
              {detailRows.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-5 py-3 text-sm">
                  <span className="text-slate-500">{key}</span>
                  <span className="text-right font-bold">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold">Actions</h2>
            <div className="grid gap-3">
              <button className="rounded-lg bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA] px-4 py-3 text-sm font-bold">
                Contacter l'intervenant
              </button>
              <button className="rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-slate-300">
                Modifier les instructions
              </button>
              <button className="rounded-lg border border-[#F87171]/25 bg-[#F87171]/10 px-4 py-3 text-sm font-bold text-[#F87171]">
                Signaler un problème
              </button>
            </div>
          </Card>

          {!isMerchant ? (
            <Card className="p-5">
              <h2 className="text-sm font-bold">Confirmer la réception</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {canConfirm ? 'La livraison est terminée, la réception peut être confirmée.' : 'Disponible lorsque le colis sera remis.'}
              </p>
              <button
                className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-bold ${
                  canConfirm ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-white/10 text-slate-500'
                }`}
                disabled={!canConfirm}
              >
                Confirmer
              </button>
            </Card>
          ) : null}

          <button
            onClick={() => onNavigate(isMerchant ? 'merchant' : 'client')}
            className="text-sm font-bold text-[#8BA8FF]"
          >
            {isMerchant ? 'Retour au tableau de bord' : "Retour à l’accueil client"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryTracking
