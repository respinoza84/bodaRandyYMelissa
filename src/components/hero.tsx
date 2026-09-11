"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { photos, wedding } from "@/config/wedding";
import { VideoModal } from "./video-modal";

const INTERVAL = 5000;

export function Hero() {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) return;
    const id = setInterval(() => setI((n) => (n + 1) % photos.length), INTERVAL);
    return () => clearInterval(id);
  }, [open]);

  return (
    <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-olive-deep text-cream">
      {photos.map((p, n) => (
        <Image
          key={p.src} src={p.src} alt={n === i ? p.alt : ""} fill sizes="100vw" quality={85}
          priority={n === 0} aria-hidden={n !== i}
          className={`fade object-cover transition-opacity duration-[1400ms] ease-in-out ${n === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-olive-deep/85 via-olive-deep/20 to-transparent" />

      <div className="relative flex h-full flex-col items-center justify-end px-6 pb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase">Nuestra boda</p>
        <h1 className="font-script mt-2 text-6xl leading-none sm:text-8xl">{wedding.couple}</h1>
        <p className="mt-5 text-lg font-light sm:text-xl">
          {wedding.dateLabel} · {wedding.city}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-cream/70 px-6 py-3 text-sm backdrop-blur-sm transition hover:bg-cream hover:text-olive-deep focus-visible:outline-2 focus-visible:outline-cream"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
          Ver nuestro video
        </button>

        <div className="mt-10 flex gap-2" role="tablist" aria-label="Fotos">
          {photos.map((p, n) => (
            <button
              key={p.src} role="tab" aria-selected={n === i} aria-label={`Foto ${n + 1}`}
              onClick={() => setI(n)}
              className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-cream" : "w-1.5 bg-cream/50"}`}
            />
          ))}
        </div>
      </div>

      <a href="#invitacion" aria-label="Ver la invitación" className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/70">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>
      </a>

      <VideoModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
