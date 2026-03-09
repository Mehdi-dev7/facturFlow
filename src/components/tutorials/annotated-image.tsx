// src/components/tutorials/annotated-image.tsx
// Composant image avec annotations CSS (cercles, masques, badges, flèches) superposés
// Utilise next/image pour l'optimisation (lazy loading, responsive, formats modernes)

import Image from "next/image";

export type Annotation =
  | { type: "circle"; cx: number; cy: number; r: number; color?: string }
  | { type: "rect"; x: number; y: number; w: number; h: number; color?: string }
  | { type: "mask"; x: number; y: number; w: number; h: number; bg?: string }
  | { type: "badge"; x: number; y: number; text: string; color?: string }
  // Flèche SVG : coordonnées en % de l'image (0–100)
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number; color?: string };

interface AnnotatedImageProps {
  src: string;
  alt: string;
  annotations?: Annotation[];
}

export function AnnotatedImage({ src, alt, annotations = [] }: AnnotatedImageProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg select-none">
      {/* Conteneur responsive — l'image remplit toute la largeur */}
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={750}
        className="w-full h-auto block"
        draggable={false}
        sizes="(max-width: 768px) 100vw, 720px"
        quality={80}
      />

      {/* SVG overlay pour les flèches */}
      {annotations.some((a) => a.type === "arrow") && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {["#16a34a", "#635BFF", "#7c3aed", "#ef4444", "#f59e0b"].map((c) => (
              <marker
                key={c}
                id={`arrow-${c.replace("#", "")}`}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill={c} />
              </marker>
            ))}
          </defs>
          {annotations
            .filter((a): a is Extract<Annotation, { type: "arrow" }> => a.type === "arrow")
            .map((ann, i) => {
              const c = ann.color ?? "#7c3aed";
              return (
                <line
                  key={i}
                  x1={ann.x1}
                  y1={ann.y1}
                  x2={ann.x2}
                  y2={ann.y2}
                  stroke={c}
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${c.replace("#", "")})`}
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                />
              );
            })}
        </svg>
      )}

      {annotations.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {annotations.map((ann, i) => {

            // Encadré visible (bordure colorée, fond semi-transparent)
            if (ann.type === "rect") {
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    width: `${ann.w}%`,
                    height: `${ann.h}%`,
                    border: `3px solid ${ann.color ?? "#7c3aed"}`,
                    backgroundColor: `${ann.color ?? "#7c3aed"}18`,
                    borderRadius: 6,
                    boxShadow: `0 0 0 2px white, 0 0 0 4px ${ann.color ?? "#7c3aed"}44`,
                  }}
                />
              );
            }

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
