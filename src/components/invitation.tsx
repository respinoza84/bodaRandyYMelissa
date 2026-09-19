import Image from "next/image";
import { wedding } from "@/config/wedding";

// Invitación virtual: misma estructura y paleta que la impresa. `children` es el bloque de confirmación.
export function Invitation({ children, guestCount }: { children?: React.ReactNode; guestCount?: number }) {
  return (
    <section id="invitacion" className="relative mx-auto max-w-[640px] overflow-hidden">
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/leaf-topleft.png" alt="" className="pointer-events-none absolute -top-2 -left-3 w-44 sm:w-52" />

      <header className="px-8 pt-36 text-right sm:pt-40">
        <p className="text-2xl font-light">Nuestra boda</p>
        <h2 className="font-script text-6xl leading-tight text-olive sm:text-7xl">{wedding.couple}</h2>
        <hr className="mt-6 border-sand" />
        <p className="mt-3 text-sm font-light">“{wedding.verse}”</p>
        <p className="text-xs text-olive">{wedding.verseRef}</p>
      </header>

      <div className="px-8 pt-12 text-lg font-bold leading-snug">
        <p>{wedding.dateLabel}</p>
        <p>Hora: {wedding.timeLabel}</p>
        <p>Ceremonia y recepción: {wedding.venue}, {wedding.city}.</p>
        <a href={wedding.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-normal text-olive underline underline-offset-4">
          Cómo llegar
        </a>
      </div>

      <p className="mt-10 text-center text-xl font-light">· Agradecemos su puntualidad ·</p>
      {guestCount != null && (
        <div className="mx-8 mt-8 border border-sand py-4 text-center">
          <p className="font-light">Hemos reservado para usted:</p>
          <p className="font-script text-4xl text-olive">
            {guestCount} {guestCount === 1 ? "espacio" : "espacios"}
          </p>
        </div>
      )}
      <p className="mt-3 text-center font-bold">Confirmar asistencia: antes del {wedding.rsvpDeadlineLabel}</p>
      <p className="text-center font-light">Al teléfono {wedding.rsvpPhone}</p>

      {/* Banda olivo con foto que la cruza, como en la impresa */}
      <div className="relative mt-10">
        <img src="/leaf-right.png" alt="" className="pointer-events-none absolute -top-24 right-0 w-24 sm:w-28" />
        <div className="mt-10 bg-olive py-10 text-cream">
          <p className="font-script ml-[52%] mr-8 text-3xl leading-snug sm:text-4xl">{wedding.quote}</p>
        </div>
        <Image
          src="/photos/02-playa-palmeras.jpg" alt="Randy y Melissa caminando por la playa"
          width={1024} height={1280} sizes="(max-width: 640px) 42vw, 270px" quality={85}
          className="absolute top-0 left-8 w-[42%] -translate-y-[12%] shadow-lg"
        />
        <div className="h-32 sm:h-44" />
        <img src="/leaf-bottom.png" alt="" className="pointer-events-none absolute right-2 bottom-0 w-64 sm:w-80" />
      </div>

      <hr className="mx-8 mt-6 border-sand" />
      <div className="mt-4 text-center font-light">
        <p>Código de vestimenta: {wedding.dressCode}</p>
        <p>Colores reservados: {wedding.reservedColors}</p>
      </div>

      <div className="mt-8 bg-olive px-8 py-6 text-center text-cream">
        <p className="font-bold">Notas especiales</p>
        <p className="mt-2 font-light"><span className="font-bold underline">Sin niños:</span> {wedding.noKidsNote}</p>
      </div>

      <div className="px-8 py-8 text-center">
        <p className="font-bold">Sugerencia de obsequio</p>
        <p className="mt-2 font-light">{wedding.gift.intro}</p>
        <dl className="mt-4 space-y-1 font-bold">
          <div><dt className="inline">Cuenta IBAN: </dt><dd className="inline select-all">{wedding.gift.iban}</dd></div>
          <div><dt className="inline">Cuenta BAC: </dt><dd className="inline select-all">{wedding.gift.bac}</dd></div>
          <div><dt className="inline">Sinpe Móvil: </dt><dd className="inline select-all">{wedding.gift.sinpe}</dd></div>
          <div><dd>{wedding.gift.holder}</dd></div>
        </dl>
      </div>

      {children && <div id="confirmar" className="bg-olive-deep px-8 py-12 text-cream">{children}</div>}
    </section>
  );
}
