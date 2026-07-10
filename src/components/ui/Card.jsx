function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-lg border border-white/15 bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <h2 className="text-sm font-bold text-slate-100">{title}</h2>
      {action && onAction ? (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-[#6C8EFF] transition hover:text-[#9EB3FF]"
          type="button"
        >
          {action}
        </button>
      ) : action ? (
        <div className="text-xs font-semibold text-[#6C8EFF]">{action}</div>
      ) : null}
    </div>
  )
}

export default Card
