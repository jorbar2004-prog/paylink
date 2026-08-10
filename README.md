# PayLink

Tu billetera de transferencias bancarias. Escaneá el QR de cualquier comercio, copiá los datos a tu banco, y guardá el registro.

## ¿Qué hace?

- **Escanea QR** de comercios (CBU, alias, CVU)
- **Copia datos** al portapapeles y abre tu app de banco
- **Guarda historial** de pagos con categorías y notas
- **Funciona 100% offline** (IndexedDB)
- **Sincronización opcional** con Cloudflare Worker (encriptada)

## ¿Qué NO hace?

- NO custodia dinero
- NO procesa pagos
- NO requiere licencia bancaria
- NO usa Mercado Pago

## Estructura

```
paylink/
├── web/          # PWA (React + Vite + Tailwind)
│   ├── public/   # Manifest, íconos, headers de seguridad
│   └── src/      # Components, lib (DB, QR parser, crypto, sync)
└── worker/       # Cloudflare Worker (backup opcional)
```

## Deploy en Cloudflare Pages

### 1. Subir a GitHub

```bash
cd web
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/paylink.git
git push -u origin main
```

### 2. Conectar Cloudflare Pages

1. Andá a [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
2. "Create a project" → "Connect to Git"
3. Seleccioná tu repo `paylink`
4. Configuración del build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `web`
5. Agregá variable de entorno:
   - `NODE_VERSION` = `20`
6. "Save and Deploy"

### 3. Íconos

Antes de deployar, reemplazá los archivos en `web/public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Podés generarlos gratis en [favicon.io](https://favicon.io) o [icon.kitchen](https://icon.kitchen).

### 4. Instalar como PWA

En tu celu (Chrome/Android o Safari/iOS):
1. Abrí la URL de tu app deployada
2. Chrome: menú → "Agregar a pantalla de inicio"
3. Safari: compartir → "Agregar a pantalla de inicio"

### 5. Worker de backup (opcional)

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

Luego en Cloudflare Pages → Settings → Environment variables:
- `VITE_API_URL` = `https://paylink-sync.TU_SUBDOMAIN.workers.dev`

## Uso

1. Abrí PayLink
2. Escaneá el QR del comercio
3. Ingresá el monto
4. Tocá "Abrir banco" → se copian los datos y se abre tu banco
5. Transferí desde tu home banking
6. Volvé a PayLink y tocá "Ya transferí, guardar"

## Stack

- React 19 + TypeScript
- Vite + PWA plugin
- Tailwind CSS v4
- html5-qrcode (escáner)
- idb (IndexedDB)
- Web Crypto API (encriptación)
- Cloudflare Pages (hosting)
- Cloudflare Worker (backup)

## Licencia

MIT — usalo, modificálo, viralizalo.
