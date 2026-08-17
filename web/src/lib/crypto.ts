const ALGO = 'AES-GCM'
const KEY_LEN = 256

async function getKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: ALGO, length: KEY_LEN }, false, ['encrypt', 'decrypt']
  )
}

// El salt viaja junto con el blob cifrado (no hace falta guardarlo aparte):
// [salt(16 bytes)][iv(12 bytes)][ciphertext...], todo base64.

export async function encrypt(data: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await getKey(passphrase, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(data))
  const ctBytes = new Uint8Array(ciphertext as ArrayBuffer)
  const combined = new Uint8Array(salt.length + iv.length + ctBytes.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(ctBytes, salt.length + iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(encrypted: string, passphrase: string): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)
  const key = await getKey(passphrase, salt)
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}
