import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { X, Play } from "lucide-react";
import { listWorkshopMedia } from "@/lib/workshop-media.functions";

type MediaItem = {
  id: string;
  media_kind: "image" | "video" | "gif";
  media_url: string | null;
  poster_url: string | null;
  caption: string | null;
};

export function WorkshopGallery({ programId }: { programId: string }) {
  const fetch = useServerFn(listWorkshopMedia);
  const [rows, setRows] = useState<MediaItem[]>([]);
  const [active, setActive] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetch({ data: { programId } }).then((r: any[]) => setRows(r as MediaItem[])).catch(() => {});
  }, [programId]);

  if (rows.length === 0) return null;

  return (
    <>
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 snap-x">
        {rows.map((m) => (
          <button key={m.id} onClick={() => setActive(m)}
            className="relative shrink-0 h-16 w-24 rounded-md overflow-hidden bg-muted snap-start group">
            {m.media_kind === "video" ? (
              <>
                <video src={m.media_url ?? undefined} poster={m.poster_url ?? undefined} muted playsInline preload="metadata"
                  className="w-full h-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/30 group-hover:bg-black/40">
                  <Play size={16} className="text-white" />
                </span>
              </>
            ) : (
              <img src={m.media_url ?? ""} alt={m.caption ?? ""} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {active && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button onClick={() => setActive(null)} aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-muted border border-border"><X size={16} /></button>
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-3">
            {active.media_kind === "video"
              ? <video src={active.media_url ?? undefined} poster={active.poster_url ?? undefined} controls autoPlay playsInline className="max-h-[80vh] w-auto rounded-lg" />
              : <img src={active.media_url ?? ""} alt={active.caption ?? ""} className="max-h-[80vh] w-auto rounded-lg" />}
            {active.caption && <p className="text-sm text-muted-foreground">{active.caption}</p>}
          </div>
        </motion.div>
      )}
    </>
  );
}
