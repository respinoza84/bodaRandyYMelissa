# Boda Randy & Melissa — invitaciones y confirmación

Next.js 15 · Neon Postgres · Drizzle · Resend · Vercel. Todo el texto del evento está en `src/config/wedding.ts`.

## Rutas
- `/` landing pública (pendiente de maquetar)
- `/invitacion/<code>` invitación personal de cada grupo + formulario de confirmación
- `/admin` panel (contraseña): estado por grupo, enviar correo, abrir WhatsApp, exportar CSV

## Fotos en alta resolución
`npm run photos:fetch -- "<url del álbum de Google Photos>"` descarga los originales y crea `assets/contact-sheet.jpg`; se eligen los números y `npm run photos:optimize -- 03:01-beso-atardecer 11:02-playa-palmeras …` los deja en `public/photos`. `next/image` sirve variantes por tamaño de pantalla.

## Puesta en marcha (una vez)
1. **Repo**: `git init && git add . && git commit -m "init"`, subir a GitHub, importar en Vercel.
2. **Base de datos**: en el proyecto de Vercel → *Storage* → *Create Database* → **Neon** (plan Free). Vercel inyecta `DATABASE_URL` sola. Región: `us-east-1` (Washington) es la más cercana a Costa Rica.
3. **Correo**: crear cuenta en resend.com → *Domains* → agregar `randyymelissa.com`. Resend da 3 registros DNS (SPF, DKIM, DMARC); agregarlos en Vercel → *Domains* → `randyymelissa.com` → *DNS Records*. Crear API key.
4. **Variables** en Vercel → *Settings* → *Environment Variables* (ver `.env.example`): `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.
5. **Local**: `vercel env pull .env.local` (o copiar a mano), luego `npm install`.
6. **Tablas**: `npm run db:push`.
7. **Invitados**: revisar `data/invitados.csv` (columnas `grupo,contacto,email,telefono,invitado`; teléfono en formato `506XXXXXXXX`) y correr `npm run db:seed`.
8. **Dominio**: comprar `randyymelissa.com` desde Vercel → *Domains* y asignarlo al proyecto. Vercel configura DNS y SSL solo.

## Flujo de envío
- **Correo**: desde `/admin`, botón *Enviar* por grupo (solo si tiene correo).
- **WhatsApp**: botón *Abrir chat* genera un enlace `wa.me` con el mensaje y el link personal listos; se envía desde el teléfono de los novios y luego *marcar enviado*. No requiere API de Meta.
- Cada grupo confirma persona por persona; puede cambiar su respuesta reabriendo el mismo enlace. Al confirmar recibe un correo de acuse.

## Al terminar (diciembre)
`npm run db:seed` no borra nada; para cerrar, exportar CSV desde `/admin` y borrar el proyecto/DB en Vercel.
