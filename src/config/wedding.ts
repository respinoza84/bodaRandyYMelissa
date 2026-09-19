// Datos del evento. Todo lo que cambie de texto vive aquí, no en los componentes.
export const wedding = {
  siteUrl: "https://randyymelissa.bodas-costarica.com", // dominio oficial; NEXT_PUBLIC_SITE_URL lo puede sobrescribir
  emailFrom: "Melissa y Randy <invitacion@bodas-costarica.com>", // EMAIL_FROM lo puede sobrescribir
  couple: "Melissa y Randy",
  bride: "Melissa",
  groom: "Randy",
  date: new Date("2026-12-13T14:30:00-06:00"),
  dateLabel: "13 de diciembre, 2026",
  timeLabel: "2:30 p. m.",
  venue: "Sala de Eventos La Alborada",
  city: "San Isidro de Heredia",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sala+de+Eventos+La+Alborada+San+Isidro+de+Heredia",
  rsvpDeadlineLabel: "8 de noviembre",
  rsvpPhone: "8883 7958",
  verse: "Por encima de todo, vístanse de amor, que es el vínculo perfecto",
  verseRef: "Colosenses 3:14",
  quote: "Nuestro amor nació en Dios, crece en Cristo y permanecerá por su gracia.",
  dressCode: "Formal – Casual",
  reservedColors: "Blanco y verde",
  noKidsNote: "Un evento para adultos está en camino, así que prepárate para una noche llena de diversión.",
  gift: {
    intro: "El mejor regalo es compartir este día con ustedes. Sin embargo, si desean hacernos un obsequio, agradecemos que sea en efectivo (contaremos con sobres) o por transferencia electrónica.",
    iban: "CR26010200009304207656",
    bac: "930420765",
    sinpe: "8883-7958",
    holder: "Melissa Chavarria Segura",
  },
  contactPhone: "+50688837958",
};

export const photos = [
  { src: "/photos/01-beso-atardecer.jpg", alt: "Randy y Melissa se besan en la playa al atardecer" },
  { src: "/photos/02-playa-palmeras.jpg", alt: "Caminando de la mano por la orilla" },
  { src: "/photos/03-montana-nubes.jpg", alt: "Abrazados en la montaña sobre las nubes" },
  { src: "/photos/04-playa-cielo-azul.jpg", alt: "Mirándose frente al mar" },
  { src: "/photos/07-beso-mar.jpg", alt: "Un beso frente a las olas" },
  { src: "/photos/08-montana-ramo.jpg", alt: "Melissa con su ramo en la montaña" },
  { src: "/photos/06-dron-olas.jpg", alt: "Vista aérea de la pareja entre las olas" },
  { src: "/photos/05-playa-nublado.jpg", alt: "En la orilla bajo un cielo nublado" },
];
