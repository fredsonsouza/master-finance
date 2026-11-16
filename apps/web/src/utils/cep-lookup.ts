export interface CepAddressResult {
  zipCode: string
  street: string
  neighborhood: string
  city: string
  state: string
  complement: string
  formattedAddress: string
}

export function formatCepInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

export function formatMobilePhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function formatLandlinePhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`
}

export function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export function composeFullAddress(parts: {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}): string {
  const streetPart = parts.street?.trim() || ''
  const numberPart = parts.number?.trim() ? `, ${parts.number.trim()}` : ''
  const complementPart = parts.complement?.trim()
    ? `, ${parts.complement.trim()}`
    : ''
  const neighborhoodPart = parts.neighborhood?.trim()
    ? `, ${parts.neighborhood.trim()}`
    : ''
  const cityStatePart = [parts.city?.trim(), parts.state?.trim()]
    .filter(Boolean)
    .join('/')

  const base = `${streetPart}${numberPart}${complementPart}${neighborhoodPart}`
    .replace(/^,\s*/, '')
    .trim()

  if (base && cityStatePart) {
    return `${base} - ${cityStatePart}`
  }
  return base || cityStatePart
}

/**
 * Consulta endereço a partir do CEP utilizando ViaCEP (base dos Correios)
 * como provedor primário e BrasilAPI (Correios/ViaCEP/WideNet) como fallback.
 */
export async function lookupAddressByCep(
  rawCep: string
): Promise<CepAddressResult | null> {
  const cleanCep = rawCep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    return null
  }

  // 1. Provedor Primário: ViaCEP (Base Oficial Correios)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as {
        erro?: boolean
        cep?: string
        logradouro?: string
        complemento?: string
        bairro?: string
        localidade?: string
        uf?: string
      }

      if (!data.erro && (data.logradouro || data.localidade)) {
        const street = data.logradouro || ''
        const neighborhood = data.bairro || ''
        const city = data.localidade || 'Boa Vista'
        const state = data.uf || 'RR'
        const complement = data.complemento || ''

        return {
          zipCode: formatCepInput(data.cep || cleanCep),
          street,
          neighborhood,
          city,
          state,
          complement,
          formattedAddress: composeFullAddress({
            street,
            complement,
            neighborhood,
            city,
            state,
          }),
        }
      }
    }
  } catch {
    // Continua para o fallback BrasilAPI
  }

  // 2. Provedor de Fallback: BrasilAPI CEP v2 (Correios)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://brasilapi.com.br/api/cep/v2/${cleanCep}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    )
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as {
        cep?: string
        street?: string
        neighborhood?: string
        city?: string
        state?: string
      }

      if (data.street || data.city) {
        const street = data.street || ''
        const neighborhood = data.neighborhood || ''
        const city = data.city || 'Boa Vista'
        const state = data.state || 'RR'

        return {
          zipCode: formatCepInput(data.cep || cleanCep),
          street,
          neighborhood,
          city,
          state,
          complement: '',
          formattedAddress: composeFullAddress({
            street,
            neighborhood,
            city,
            state,
          }),
        }
      }
    }
  } catch {
    // Ignora falha de rede
  }

  return null
}
