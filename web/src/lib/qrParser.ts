import { Merchant } from '../types'

export function parseQR(data: string): Merchant | null {
  const lines = data.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
  const map = new Map<string, string>()

  for (const line of lines) {
    const [key, ...rest] = line.split(/[:=]/)
    if (key && rest.length > 0) {
      map.set(key.trim().toUpperCase(), rest.join(':').trim())
    }
  }

  const cbu = map.get('CBU') || map.get('CVU') || extractCBU(data)
  const alias = map.get('ALIAS') || map.get('ALIAS CBU') || extractAlias(data)
  const name = map.get('TITULAR') || map.get('NOMBRE') || map.get('COMERCIO') || 'Comercio'

  if (cbu || alias) {
    return { name, cbu: cbu || '', alias: alias || '' }
  }

  const emvAlias = extractEMVAlias(data)
  if (emvAlias) {
    return { name: 'Comercio', cbu: '', alias: emvAlias }
  }

  const soloAlias = extractAlias(data)
  const soloCBU = extractCBU(data)
  if (soloAlias || soloCBU) {
    return { name: 'Comercio', cbu: soloCBU || '', alias: soloAlias || '' }
  }

  return null
}

function extractCBU(text: string): string | null {
  const match = text.match(/\b\d{22}\b/)
  return match ? match[0] : null
}

function extractAlias(text: string): string | null {
  const match = text.match(/\b[A-Z][A-Z0-9.]{5,19}\b/)
  return match ? match[0] : null
}

function extractEMVAlias(text: string): string | null {
  if (!text.startsWith('0002')) return null
  const aliasMatch = text.match(/[A-Z][A-Z0-9.]{5,19}/)
  return aliasMatch ? aliasMatch[0] : null
}
