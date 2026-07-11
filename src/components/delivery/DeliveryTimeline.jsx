const bubbleStyles = {
  done: 'border-[#34D399] bg-[#34D399]/15 text-[#34D399]',
  active: 'border-[#6C8EFF] bg-[#6C8EFF]/15 text-[#8BA8FF]',
  pending: 'border-white/10 bg-white/[0.03] text-slate-500',
}

function DeliveryTimeline({ steps }) {
  return (
    <div>
      {steps.map((step, index) => (
        <div key={step.id} className="grid grid-cols-[32px_1fr] gap-4">
          <div className="flex flex-col items-center">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold ${bubbleStyles[step.status]}`}>
              {index + 1}
            </div>
            {index < steps.length - 1 ? <div className="my-1 min-h-6 w-0.5 flex-1 bg-white/10" /> : null}
          </div>
          <div className={index < steps.length - 1 ? 'pb-6' : ''}>
            <h3 className="text-sm font-bold">{step.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">{step.description}</p>
            <p className="mt-2 text-xs text-slate-600">{step.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DeliveryTimeline
