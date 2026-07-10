const tones = {
  blue: 'bg-[#6C8EFF]/15 text-[#8BA8FF]',
  green: 'bg-[#34D399]/15 text-[#34D399]',
  amber: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  red: 'bg-[#F87171]/15 text-[#F87171]',
  purple: 'bg-[#A78BFA]/15 text-[#C4B5FD]',
}

function StatusPill({ children, tone = 'blue', variant = 'default' }) {
  const shape = variant === 'label' ? 'rounded-md' : 'rounded-md'

  return (
    <span
      className={`inline-flex min-h-[26px] min-w-[108px] items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1 text-[11px] font-bold ${shape} ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  )
}

export default StatusPill
