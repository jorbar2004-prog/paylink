export interface Env {
  // DB: D1Database  // descomentar cuando configures D1
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const { data: encryptedBlob } = await request.json() as { data: string }

      // TODO: cuando tengas D1 configurada, guardá el blob encriptado:
      // await env.DB.prepare(`
      //   INSERT INTO backups (device_id, encrypted_data, created_at)
      //   VALUES (?, ?, datetime('now'))
      //   ON CONFLICT(device_id) DO UPDATE SET
      //     encrypted_data = excluded.encrypted_data,
      //     created_at = excluded.created_at
      // `).bind('unknown', encryptedBlob).run()

      return new Response(JSON.stringify({ ok: true, imported: [] }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    } catch {
      return new Response(JSON.stringify({ error: 'Sync failed' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
  },
}
