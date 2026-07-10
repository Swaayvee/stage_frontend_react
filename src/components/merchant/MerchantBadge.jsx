import { getMerchant } from '../../data/deliveries'

function MerchantBadge({ merchantId, size = 'md' }) {
  const merchant = getMerchant(merchantId)
  if (!merchant) return null

  const sizes = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border font-bold ${sizes[size]}`}
      style={{
        borderColor: `${merchant.color}40`,
        backgroundColor: `${merchant.color}15`,
        color: merchant.color,
      }}
    >
      <span
        className="grid h-5 w-5 place-items-center rounded-sm text-[10px] font-extrabold text-white"
        style={{ backgroundColor: merchant.color }}
      >
        {merchant.initial}
      </span>
      {merchant.name}
    </span>
  )
}

export default MerchantBadge
