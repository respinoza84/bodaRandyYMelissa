"use client";

import { useEffect, useRef } from "react";

export function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto max-h-[92svh] w-auto max-w-[92vw] rounded-lg bg-transparent p-0 backdrop:bg-olive-deep/90"
    >
      {open && (
        <video
          src="/video/nuestro-video.mp4" poster="/video/poster.jpg"
          controls autoPlay playsInline
          className="max-h-[92svh] rounded-lg"
        />
      )}
      <button onClick={onClose} aria-label="Cerrar" className="absolute top-2 right-2 rounded-full bg-olive-deep/70 px-3 py-1 text-cream">✕</button>
    </dialog>
  );
}
