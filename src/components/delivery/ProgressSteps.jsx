const stepStyles = {
  done: 'border-[#34D399] bg-[#070C1A] text-[#34D399]',
  active: 'border-[#6C8EFF] bg-[#070C1A] text-[#8BA8FF] shadow-[0_0_0_6px_rgba(108,142,255,0.10)]',
  pending: 'border-white/10 bg-[#070C1A] text-slate-500',
}

function ProgressSteps({ steps }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.035] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
      <div className="flex items-start">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-start">
            <div className="flex w-full flex-col items-center text-center">
              <div
                className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-bold ${stepStyles[step.status]}`}
              >
                {step.icon}
              </div>
              <div className="mt-3 text-[11px] font-bold text-slate-300">{step.label}</div>
              <div className="mt-1 text-[10px] text-slate-500">{step.time}</div>
            </div>
            {index < steps.length - 1 ? (
              <div className="mt-5 h-px flex-1 bg-white/10" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressSteps
