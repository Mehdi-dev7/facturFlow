// src/components/tutorials/annotated-image.tsx
// Composant image avec annotations CSS (cercles, masques, badges) superposés

export type Annotation =
  | { type: "circle"; cx: number; cy: number; r: number; color?: string }
  | { type: "mask"; x: number; y: number; w: number; h: number; bg?: string }
  | { type: "badge"; x: number; y: number; text: string; color?: string };

interface AnnotatedImageProps {
  src: string;
  alt: string;
  annotations?: Annotation[];
}

export function AnnotatedImage({ src, alt, annotations = [] }: AnnotatedImageProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-auto block" draggable={false} />

      {annotations.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {annotations.map((ann, i) => {

            // Rectangle opaque pour masquer une info personnelle
            if (ann.type === "mask") {
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    width: `${ann.w}%`,
                    height: `${ann.h}%`,
                    backgroundColor: ann.bg ?? "#1e293b",
                    borderRadius: 3,
                  }}
                />
              );
            }

            // Cercle d'annotation avec double contour (blanc + couleur)
            if (ann.type === "circle") {
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${ann.cx - ann.r}%`,
                    top: `${ann.cy}%`,
                    transform: "translateY(-50%)",
                    width: `${ann.r * 2}%`,
                    aspectRatio: "1",
                    borderRadius: "50%",
                    border: `3px solid ${ann.color ?? "#7c3aed"}`,
                    boxShadow: `0 0 0 2px white, 0 0 0 4px ${ann.color ?? "#7c3aed"}66`,
                  }}
                />
              );
            }

            // Badge pill (label flottant)
            if (ann.type === "badge") {
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: "translateX(-50%)",
                    backgroundColor: ann.color ?? "#7c3aed",
                    color: "white",
                    padding: "2px 10px",
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {ann.text}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
