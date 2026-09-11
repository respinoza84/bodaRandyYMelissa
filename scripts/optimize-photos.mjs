// Toma originales elegidos y los deja listos en public/photos (máx. 2560 px, JPEG 82).
// next/image genera después las variantes por tamaño de pantalla.
//
//   node scripts/optimize-photos.mjs 03:01-beso-atardecer 11:02-playa-palmeras ...
//   (número de la hoja de contacto : nombre de salida)
import sharp from "sharp";
for (const arg of process.argv.slice(2)) {
  const [n, name] = arg.split(":");
  const out = `public/photos/${name}.jpg`;
  const { width, height } = await sharp(`assets/originals/${n}.jpg`).rotate()
    .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(`${out}  ${width}x${height}`);
}
