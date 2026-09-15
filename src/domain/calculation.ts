export type WageSession = {
  hourlyRate: number
  hours: number
  minutes: number
  bonus: number
}

export type Piecework = {
  unitPrice: number
  quantity: number
}

export type WageInput = {
  am: WageSession
  pm: WageSession
  pieceworks: Piecework[]
}

export type WageResult = {
  am: number
  pm: number
  piecework: number
  total: number
}

const nonNegative = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0

const calculateSession = ({ hourlyRate, hours, minutes, bonus }: WageSession) => {
  const safeHours = nonNegative(hours)
  const safeMinutes = Number.isFinite(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0
  const amount = hourlyRate > 0 && Number.isFinite(hourlyRate)
    ? hourlyRate * (safeHours + safeMinutes / 60) + nonNegative(bonus)
    : nonNegative(bonus)
  return Math.ceil(amount)
}

export const calculateWage = ({ am, pm, pieceworks }: WageInput): WageResult => {
  const amTotal = calculateSession(am)
  const pmTotal = calculateSession(pm)
  const pieceworkTotal = Math.ceil(pieceworks.reduce((total, item) => {
    const unitPrice = nonNegative(item.unitPrice)
    const quantity = nonNegative(item.quantity)
    return total + unitPrice * quantity
  }, 0))

  return {
    am: amTotal,
    pm: pmTotal,
    piecework: pieceworkTotal,
    total: amTotal + pmTotal + pieceworkTotal,
  }
}
