export interface EvaluationAvailability {
  isOpen: boolean
  message?: string
  nextOpening?: string
  currentRoraimaTime?: string
}

/**
 * Valida se o momento atual (ou data informada) está dentro do período
 * de avaliações permitido no fuso horário oficial de Roraima (America/Boa_Vista, UTC-4).
 *
 * Regras:
 * - Segunda a Sexta: 06:00 às 18:20 (Atendimento até 18:00 com 20min de tolerância)
 * - Sábado: 06:00 às 12:20 (Atendimento até 12:00 com 20min de tolerância)
 * - Domingo: Fechado o dia todo
 */
export function checkEvaluationAvailability(date: Date = new Date()): EvaluationAvailability {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Boa_Vista',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const partMap: Record<string, string> = {}
  for (const part of parts) {
    partMap[part.type] = part.value
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  const dayOfWeek = weekdayMap[partMap.weekday] ?? 0
  let hour = parseInt(partMap.hour || '0', 10)
  if (hour === 24) hour = 0
  const minute = parseInt(partMap.minute || '0', 10)
  const totalMinutes = hour * 60 + minute

  const OPENING_MINUTES = 6 * 60 // 06:00 (360 min)
  const WEEKDAY_CLOSING_MINUTES = 18 * 60 + 20 // 18:20 (1100 min)
  const SATURDAY_CLOSING_MINUTES = 12 * 60 + 20 // 12:20 (740 min)

  const formattedCurrentTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  // Domingo (fechado o dia todo)
  if (dayOfWeek === 0) {
    return {
      isOpen: false,
      message:
        'O período de avaliações não funciona aos domingos. O atendimento retornará na segunda-feira a partir das 06h00.',
      nextOpening: 'Segunda-feira às 06:00',
      currentRoraimaTime: formattedCurrentTime,
    }
  }

  // Segunda a Sexta (dias 1 a 5)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (totalMinutes >= OPENING_MINUTES && totalMinutes < WEEKDAY_CLOSING_MINUTES) {
      return {
        isOpen: true,
        currentRoraimaTime: formattedCurrentTime,
      }
    }

    if (totalMinutes < OPENING_MINUTES) {
      return {
        isOpen: false,
        message: 'O período de avaliações inicia hoje a partir das 06h00.',
        nextOpening: 'Hoje às 06:00',
        currentRoraimaTime: formattedCurrentTime,
      }
    }

    // Após as 18:20
    const nextDay = dayOfWeek === 5 ? 'sábado' : 'amanhã'
    return {
      isOpen: false,
      message: `O período de avaliações de hoje encerrou às 18h20. O atendimento retornará ${nextDay} a partir das 06h00.`,
      nextOpening: `${dayOfWeek === 5 ? 'Sábado' : 'Amanhã'} às 06:00`,
      currentRoraimaTime: formattedCurrentTime,
    }
  }

  // Sábado (dia 6)
  if (dayOfWeek === 6) {
    if (totalMinutes >= OPENING_MINUTES && totalMinutes < SATURDAY_CLOSING_MINUTES) {
      return {
        isOpen: true,
        currentRoraimaTime: formattedCurrentTime,
      }
    }

    if (totalMinutes < OPENING_MINUTES) {
      return {
        isOpen: false,
        message: 'O período de avaliações inicia hoje (sábado) a partir das 06h00.',
        nextOpening: 'Hoje às 06:00',
        currentRoraimaTime: formattedCurrentTime,
      }
    }

    // Após as 12:20 no Sábado
    return {
      isOpen: false,
      message:
        'O período de avaliações encerrou às 12h20 deste sábado. O atendimento retornará na segunda-feira a partir das 06h00.',
      nextOpening: 'Segunda-feira às 06:00',
      currentRoraimaTime: formattedCurrentTime,
    }
  }

  return {
    isOpen: false,
    message: 'Período de avaliações indisponível no momento.',
    currentRoraimaTime: formattedCurrentTime,
  }
}
