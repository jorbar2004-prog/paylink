import { Merchant } from '../types'
import { validateCBU } from './cbu'

interface TLVEntry {
  tag: string
  value: string
}

// Tags EMV que son "templates" (contienen sub-TLVs anidados) según el
// estándar EMV QR Code Specification for Payment Systems, usado como base
// por el QR interoperable de transferencias del BCRA (Transferencias 3.0).
// 02–51: Merchant Account Information templates. 62: Additional Data Field.
function isTemplateTag(tag: string): boolean {
  const n = Number(tag)
  return (n >= 2 && n <= 51) || tag === '62' || tag === '64'
}

/**
 * Decodifica una cadena EMV TLV plana: TAG(2) + LEN(2) + VALUE(LEN), repetido.
 * Devuelve null si la cadena no respeta ese formato (longitudes inválidas,
 * truncada, etc.) — en ese caso no es un QR EMV y hay que probar el
 * formato de texto plano.
 */
function decodeTLV(data: string): TLVEntry[] | null {
  const entries: TLVEntry[] = []
  let i = 0
  while (i < data.length) {
    if (i + 4 > data.length) return null
    const tag = data.slice(i, i + 2)
    const lenStr = data.slice(i + 2, i + 4)
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) return null
    const len = Number(lenStr)
    const value = data.slice(i + 4, i + 4 + len)
    if (value.length !== len) return null
    entries.push({ tag, value })
    i += 4 + len
  }
  return entries.length > 0 ? entries : null
}

/** Recorre recursivamente los templates y devuelve todos los pares hoja (tag, value). */
function collectLeaves(entries: TLVEntry[]): TLVEntry[] {
  const leaves: TLVEntry[] = []
  for (const entry of entries) {
    if (isTemplateTag(entry.tag)) {
      const nested = decodeTLV(entry.value)
      if (nested) {
        leaves.push(...collectLeaves(nested))
        continue
      }
    }
    leaves.push(entry)
  }
  return leaves
}

const CBU_RE = /\b\d{22}\b/
const ALIAS_RE = /\b[A-Z][A-Z0-9.]{5,19}\b/

/** Intenta parsear un QR interoperable estándar EMV MPQR (BCRA Transferencias 3.0). */
function parseEMV(data: string): Merchant | null {
  const top = decodeTLV(data)
  if (!top) return null

  // Un QR EMV válido arranca con el "Payload Format Indicator" (tag 00 = "01").
  if (top[0]?.tag !== '00' || top[0]?.value !== '01') return null

  const leaves = collectLeaves(top)

  // Tag 59 = Merchant Name (texto plano, según spec EMV)
  const nameLeaf = leaves.find(l => l.tag === '59')

  let cbu: string | null = null
  let alias: string | null = null
  for (const leaf of leaves) {
    if (!cbu) {
      const m = leaf.value.match(CBU_RE)
      if (m) cbu = m[0]
    }
    if (!alias) {
      const m = leaf.value.match(ALIAS_RE)
      if (m) alias = m[0]
    }
  }

  if (!cbu && !alias) return null

  return {
    name: nameLeaf?.value?.trim() || 'Comercio',
    cbu: cbu || '',
    alias: alias || '',
    cbuValid: cbu ? validateCBU(cbu) : undefined,
  }
}

/** Formato "legado" de texto plano: líneas tipo "CBU: 000..." / "ALIAS: nombre". */
function parseLegacyText(data: string): Merchant | null {
  const lines = data.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
  const map = new Map<string, string>()

  for (const line of lines) {
    const [key, ...rest] = line.split(/[:=]/)
    if (key && rest.length > 0) {
      map.set(key.trim().toUpperCase(), rest.join(':').trim())
    }
  }

  const cbu = map.get('CBU') || map.get('CVU') || extractFirst(data, CBU_RE)
  const alias = map.get('ALIAS') || map.get('ALIAS CBU') || extractFirst(data, ALIAS_RE)
  const name = map.get('TITULAR') || map.get('NOMBRE') || map.get('COMERCIO') || 'Comercio'

  if (!cbu && !alias) return null

  return {
    name,
    cbu: cbu || '',
    alias: alias || '',
    cbuValid: cbu ? validateCBU(cbu) : undefined,
  }
}

function extractFirst(text: string, re: RegExp): string | null {
  const match = text.match(re)
  return match ? match[0] : null
}

/**
 * Parsea el contenido de un QR de transferencia. Prueba primero el
 * estándar EMV MPQR (el que generan los bancos/billeteras reales bajo
 * "Transferencias 3.0" del BCRA); si no matchea, cae al formato de texto
 * plano por si el comercio armó su propio QR casero con "CBU: ..." / "ALIAS: ...".
 */
export function parseQR(data: string): Merchant | null {
  return parseEMV(data) || parseLegacyText(data)
}
