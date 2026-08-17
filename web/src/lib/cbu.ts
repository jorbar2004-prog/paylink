
// Validación de CBU/CVU (Argentina) con dígito verificador.
// Un CBU tiene 22 dígitos: 8 dígitos de "entidad+sucursal" (con 1 dígito
// verificador) + 14 dígitos de "cuenta" (con 1 dígito verificador).
// Fuente del algoritmo: especificación estándar usada por BCRA/COELSA.

function verificarBloque(base: string, digitoEsperado: string, pesos: number[]): boolean {
  let suma = 0
  for (let i = 0; i < base.length; i++) {
    suma += Number(base[i]) * pesos[i]
  }
  let verif = 10 - (suma % 10)
  if (verif === 10) verif = 0
  return verif === Number(digitoEsperado)
}

/**
 * Valida el dígito verificador de un CBU/CVU de 22 dígitos.
 * Devuelve false si el formato no es válido (longitud, no numérico) o si
 * el checksum no coincide.
 */
export function validateCBU(cbu: string): boolean {
  if (!/^\d{22}$/.test(cbu)) return false

  const bloque1 = cbu.slice(0, 7) // entidad (3) + sucursal (4)
  const digito1 = cbu[7]
  const bloque2 = cbu.slice(8, 21) // cuenta (13)
  const digito2 = cbu[21]

  const pesos1 = [7, 1, 3, 9, 7, 1, 3]
  const pesos2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]

  return verificarBloque(bloque1, digito1, pesos1) && verificarBloque(bloque2, digito2, pesos2)
}

/**
 * Formatea un CBU para mostrar en 4 grupos de fácil lectura, sin alterar
 * el valor original que se copia/usa para transferir.
 */
export function formatCBU(cbu: string): string {
  if (!/^\d{22}$/.test(cbu)) return cbu
  return `${cbu.slice(0, 3)} ${cbu.slice(3, 7)} ${cbu.slice(7, 8)} ${cbu.slice(8, 21)} ${cbu.slice(21)}`
}
