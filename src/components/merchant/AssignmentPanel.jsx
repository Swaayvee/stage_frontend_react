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
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-bold">Choisir la prise en charge pour {delivery.shortId}</div>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { id: 'internal', title: 'Livreur interne' },
              { id: 'carrier', title: 'Transporteur tiers' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onHandlingModeChange(option.id)}
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
            {options.length === 0 ? (
              <div className="rounded-lg border border-white/10 p-3 text-xs text-slate-500">
                Aucun {handlingMode === 'internal' ? 'livreur interne' : 'transporteur'} disponible pour cette distance.
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onAssigneeChange(option.id)}
                  className={`grid grid-cols-[1fr_auto] gap-3 rounded-lg border px-4 py-3 text-left ${
                    selectedAssignee === option.id
                      ? handlingMode === 'internal'
                        ? 'border-[#34D399]/30 bg-[#34D399]/10'
                        : 'border-[#A78BFA]/30 bg-[#A78BFA]/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-bold">{resolveName(option)}</span>
                    <span className="block text-xs text-slate-500">
                      {handlingMode === 'internal' ? 'Équipe interne' : 'Prestataire externe'}
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
