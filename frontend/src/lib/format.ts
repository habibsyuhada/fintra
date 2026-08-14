export function formatMoney(amount: number | string, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString('id-ID', opts ?? { day: '2-digit', month: 'short', year: 'numeric' })
}
