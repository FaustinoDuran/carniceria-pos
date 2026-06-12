import { formatMoney } from '@/lib/formatters'

export function Money({ value }: { value: number | null | undefined }) {
  return <span className="tabular-nums">{formatMoney(value)}</span>
}
