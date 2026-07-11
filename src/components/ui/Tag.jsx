const tones = {
  blue: 'border-[#6C8EFF]/35 bg-[#6C8EFF]/12 text-[#9EB3FF]',
  green: 'border-[#34D399]/35 bg-[#34D399]/12 text-[#7CE7B2]',
  amber: 'border-[#F59E0B]/35 bg-[#F59E0B]/12 text-[#FBC15A]',
  red: 'border-[#F87171]/35 bg-[#F87171]/12 text-[#FCA5A5]',
  purple: 'border-[#A78BFA]/35 bg-[#A78BFA]/12 text-[#D8C7FF]',
  neutral: 'border-white/10 bg-white/[0.06] text-slate-300',
}

function Tag({ children, tone = 'neutral', marker = false, className = '' }) {
  return (
    <span
      className={`inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] border px-2.5 text-[10px] font-extrabold uppercase tracking-[0.06em] ${tones[tone]} ${className}`}
    >
      {marker ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export default Tag
