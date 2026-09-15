import { describe, expect, it } from 'vitest'
import { calculateWage } from './calculation'

describe('calculateWage', () => {
  it('午前と午後を独立して計算し、出来高を合算する', () => {
    const result = calculateWage({
      am: { hourlyRate: 150, hours: 2, minutes: 30, bonus: 100 },
      pm: { hourlyRate: 100, hours: 3, minutes: 0, bonus: 100 },
      pieceworks: [
        { unitPrice: 10, quantity: 20 },
        { unitPrice: 5, quantity: 30 },
      ],
    })

    expect(result.am).toBe(475)
    expect(result.pm).toBe(400)
    expect(result.piecework).toBe(350)
    expect(result.total).toBe(1_225)
  })

  it('未入力や負数を計算に反映しない', () => {
    const result = calculateWage({
      am: { hourlyRate: 150, hours: -1, minutes: 0, bonus: 100 },
      pm: { hourlyRate: 100, hours: 0, minutes: 0, bonus: 0 },
      pieceworks: [{ unitPrice: 10, quantity: -2 }],
    })

    expect(result.am).toBe(100)
    expect(result.pm).toBe(0)
    expect(result.piecework).toBe(0)
    expect(result.total).toBe(100)
  })

  it('円未満の端数が出た場合は切り上げる', () => {
    const result = calculateWage({
      am: { hourlyRate: 150, hours: 0, minutes: 15, bonus: 0 },
      pm: { hourlyRate: 0, hours: 0, minutes: 0, bonus: 0 },
      pieceworks: [{ unitPrice: 10.5, quantity: 1 }],
    })

    expect(result.am).toBe(38)
    expect(result.piecework).toBe(11)
    expect(result.total).toBe(49)
  })
})
