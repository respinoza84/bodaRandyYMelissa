import { Hero } from "@/components/hero";
import { Invitation } from "@/components/invitation";

export default function Home() {
  return (
    <main>
      <Hero />
      <Invitation>
        <p className="text-center font-light">
          Para confirmar su asistencia, abran el enlace personal que recibieron por correo o WhatsApp.
        </p>
      </Invitation>
    </main>
  );
}
