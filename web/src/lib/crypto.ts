const ALGO = 'AES-GCM'
const KEY_LEN = 256

async function getKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('paylink-salt-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: ALGO, length: KEY_LEN }, false, ['encrypt', 'decrypt']
  )
}

export async function encrypt(data: string, passphrase: string): Promise<string> {
  const key = await getKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(data))
  const combined = new Uint8Array(iv.length + (ciphertext as ArrayBuffer).byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext as ArrayBuffer), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(encrypted: string, passphrase: string): Promise<string> {
  const key = await getKey(passphrase)
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}
