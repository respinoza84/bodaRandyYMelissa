// Descarga en máxima resolución las fotos de un álbum compartido de Google Photos
// y arma una hoja de contacto numerada para elegir.
//
//   node scripts/fetch-photos.mjs "<url del álbum>"
//
// Sale: assets/originals/NN.jpg (originales), assets/contact-sheet.jpg (numerada, con tamaños)
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const album = process.argv[2];
if (!album) { console.error("Uso: node scripts/fetch-photos.mjs <url del álbum>"); process.exit(1); }

const html = await (await fetch(album, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
// Google Photos incrusta las URLs base de cada foto en el HTML inicial.
const base = [...new Set(html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+/g) ?? [])];
if (!base.length) { console.error("No encontré fotos. ¿El enlace es del álbum compartido y sigue activo?"); process.exit(1); }
console.log(`${base.length} fotos encontradas`);

mkdirSync("assets/originals", { recursive: true });
const meta = [];
for (const [i, b] of base.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const file = `assets/originals/${n}.jpg`;
  if (!existsSync(file)) {
    // =d entrega el archivo original; si falla, =w6000 devuelve el tamaño máximo procesado.
    let res = await fetch(`${b}=d`);
    if (!res.ok) res = await fetch(`${b}=w6000-h6000`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const { width, height } = await sharp(file).metadata();
  meta.push({ n, file, width, height });
  console.log(`${n}  ${width}x${height}`);
}

// Hoja de contacto: 4 columnas, cada celda con número y dimensiones.
const cell = 360, cols = 4, rows = Math.ceil(meta.length / cols);
const tiles = await Promise.all(meta.map(async (m, i) => ({
  input: await sharp(m.file).resize(cell - 20, cell - 60, { fit: "inside" }).toBuffer(),
  left: (i % cols) * cell + 10, top: Math.floor(i / cols) * cell + 10,
})));
const labels = meta.map((m, i) => ({
  input: Buffer.from(`<svg width="${cell}" height="40"><text x="10" y="28" font-family="sans-serif" font-size="22" fill="#222">${m.n}  ·  ${m.width}×${m.height}</text></svg>`),
  left: (i % cols) * cell, top: Math.floor(i / cols) * cell + cell - 44,
}));
await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: "#ecece3" } })
  .composite([...tiles, ...labels]).jpeg({ quality: 80 }).toFile("assets/contact-sheet.jpg");
console.log("→ assets/contact-sheet.jpg  (envíamela y te digo cuáles usar)");
