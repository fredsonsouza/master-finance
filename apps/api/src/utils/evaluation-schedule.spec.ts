import { describe, expect, test } from 'vitest'
import { checkEvaluationAvailability } from './evaluation-schedule'

describe('Evaluation Schedule Utility Tests (Roraima Timezone America/Boa_Vista)', () => {
  test('should allow evaluations during weekday operating hours (06:00 to 18:20)', () => {
    // Quinta-feira 10:00 AM em Roraima (14:00 UTC) -> ABERTO
    const openMorning = new Date('2026-09-03T14:00:00Z')
    expect(checkEvaluationAvailability(openMorning).isOpen).toBe(true)

    // Quinta-feira 06:01 AM em Roraima (10:01 UTC) -> ABERTO
    const openStart = new Date('2026-09-03T10:01:00Z')
    expect(checkEvaluationAvailability(openStart).isOpen).toBe(true)

    // Quinta-feira 18:19 PM em Roraima (22:19 UTC) -> ABERTO (dentro da tolerância de 20 min)
    const openTolerance = new Date('2026-09-03T22:19:00Z')
    expect(checkEvaluationAvailability(openTolerance).isOpen).toBe(true)
  })

  test('should block evaluations on weekdays before 06:00 or after 18:20', () => {
    // Quinta-feira 05:55 AM em Roraima (09:55 UTC) -> FECHADO
    const earlyMorning = new Date('2026-09-03T09:55:00Z')
    const earlyRes = checkEvaluationAvailability(earlyMorning)
    expect(earlyRes.isOpen).toBe(false)
    expect(earlyRes.message).toContain('06h00')

    // Quinta-feira 18:21 PM em Roraima (22:21 UTC) -> FECHADO
    const closedEvening = new Date('2026-09-03T22:21:00Z')
    const closedRes = checkEvaluationAvailability(closedEvening)
    expect(closedRes.isOpen).toBe(false)
    expect(closedRes.message).toContain('18h20')
  })

  test('should allow evaluations on Saturday between 06:00 and 12:20', () => {
    // Sábado 09:30 AM em Roraima (13:30 UTC) -> ABERTO
    const satMorning = new Date('2026-09-05T13:30:00Z')
    expect(checkEvaluationAvailability(satMorning).isOpen).toBe(true)

    // Sábado 12:15 PM em Roraima (16:15 UTC) -> ABERTO
    const satTolerance = new Date('2026-09-05T16:15:00Z')
    expect(checkEvaluationAvailability(satTolerance).isOpen).toBe(true)
  })

  test('should block evaluations on Saturday after 12:20 until Monday 06:00', () => {
    // Sábado 12:25 PM em Roraima (16:25 UTC) -> FECHADO
    const satClosed = new Date('2026-09-05T16:25:00Z')
    const satClosedRes = checkEvaluationAvailability(satClosed)
    expect(satClosedRes.isOpen).toBe(false)
    expect(satClosedRes.message).toContain('12h20')
    expect(satClosedRes.nextOpening).toBe('Segunda-feira às 06:00')
  })

  test('should block evaluations on Sunday the whole day', () => {
    // Domingo 11:00 AM em Roraima (15:00 UTC) -> FECHADO
    const sunMidday = new Date('2026-09-06T15:00:00Z')
    const sunRes = checkEvaluationAvailability(sunMidday)
    expect(sunRes.isOpen).toBe(false)
    expect(sunRes.message).toContain('domingos')
    expect(sunRes.nextOpening).toBe('Segunda-feira às 06:00')
  })
})
