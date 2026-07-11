import { carriers, formatDistance, internalCouriers } from '../../data/deliveries'

function AssignmentPanel({
  delivery,
  handlingMode,
  selectedAssignee,
  onHandlingModeChange,
  onAssigneeChange,
  onPrevious,
  onNext,
  onValidate,
  hasPrevious,
  hasNext,
  validated,
  className = '',
}) {
  if (!delivery) return null

  const options =
    handlingMode === 'internal' ? delivery.assignmentOptions.internal : delivery.assignmentOptions.carrier

  const resolveName = (option) => {
    const courier = internalCouriers.find((item) => item.id === option.id)
    if (courier) return courier.name
    return carriers.find((item) => item.id === option.id)?.name ?? option.id
  }

  const selectedOption = options.find((option) => option.id === selectedAssignee)

  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-[#070C1A]/45 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Affectation en cours</div>
          <div className="mt-1 text-sm font-bold">Livraison {delivery.shortId}</div>
          <div className="mt-1 text-xs text-slate-500">{delivery.customer} · {delivery.address}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>

      {validated ? (
        <div className="rounded-lg border border-[#34D399]/25 bg-[#34D399]/10 p-4 text-sm text-[#B8F8DB]">
          Affectation validée pour {delivery.shortId}.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-white/[0.04] p-1">
            {[
              { id: 'internal', title: 'Livreur interne' },
              { id: 'carrier', title: 'Transporteur tiers' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onHandlingModeChange(option.id)}
                className={`rounded-md border px-3 py-2.5 text-left text-xs font-bold transition ${
                  handlingMode === option.id
                    ? option.id === 'internal'
                      ? 'border-[#34D399]/35 bg-[#34D399]/12 text-[#B8F8DB]'
                      : 'border-[#A78BFA]/35 bg-[#A78BFA]/12 text-[#E7DCFF]'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.05]'
                }`}
              >
                {option.title}
              </button>
            ))}
          </div>

          <p className="mb-3 text-[11px] text-slate-500">Sélectionnez l’intervenant qui prendra cette livraison en charge.</p>

          <div className="grid gap-2">
            {options.length === 0 ? (
              <div className="rounded-lg border border-white/10 p-3 text-xs text-slate-500">
                Aucun {handlingMode === 'internal' ? 'livreur interne' : 'transporteur'} disponible pour cette distance.
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onAssigneeChange(option.id)}
                  className={`group grid grid-cols-[1fr_auto] gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    selectedAssignee === option.id
                      ? handlingMode === 'internal'
                        ? 'border-[#34D399]/40 bg-[#34D399]/12 shadow-[0_8px_22px_rgba(52,211,153,0.08)]'
                        : 'border-[#A78BFA]/40 bg-[#A78BFA]/12 shadow-[0_8px_22px_rgba(167,139,250,0.08)]'
                      : 'border-dashed border-white/15 bg-white/[0.02] hover:border-[#6C8EFF]/35 hover:bg-[#6C8EFF]/[0.06]'
                  }`}
                  >
                  <span>
                    <span className="block text-sm font-bold">{resolveName(option)}</span>
                    <span className="block text-xs text-slate-500">
                      {handlingMode === 'internal' ? 'Équipe interne' : 'Prestataire externe'}
                    </span>
                    {selectedAssignee !== option.id ? <span className="mt-1 block text-[10px] font-bold text-slate-600 group-hover:text-[#8BA8FF]">Sélectionner</span> : null}
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-bold text-[#8BA8FF]">{formatDistance(option.distanceKm)}</span>
                    <span className="block text-[10px] text-slate-500">{option.eta}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            onClick={onValidate}
            disabled={!selectedAssignee}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Valider l&apos;affectation
          </button>

          {selectedOption ? (
            <div className="mt-3 rounded-lg border border-[#34D399]/20 bg-[#34D399]/10 p-3 text-xs text-[#B8F8DB]">
              {resolveName(selectedOption)} sera affecté à {delivery.shortId} (
              {handlingMode === 'internal' ? 'livreur interne' : 'transporteur tiers'}).
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export default AssignmentPanel
