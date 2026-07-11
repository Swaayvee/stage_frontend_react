import Tag from './Tag'

function StatusPill({ children, tone = 'blue', variant = 'default' }) {
  return <Tag tone={tone} marker={variant !== 'label'}>{children}</Tag>
}

export default StatusPill
