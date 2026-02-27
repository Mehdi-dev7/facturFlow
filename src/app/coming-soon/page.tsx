import { Metadata } from "next";
import { Zap, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Bientôt disponible | FacturNow",
  description: "La facturation intelligente, bientôt disponible.",
};

export default function ComingSoonPage() {
  return (
    <>
      {/* Keyframes injectés inline — pas de dépendance externe */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.80; transform: scale(1.08); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .anim-1 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.1s both; }
        .anim-2 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.25s both; }
        .anim-3 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.4s both; }
        .anim-4 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.55s both; }
        .anim-5 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.7s both; }
        .glow    { animation: pulseGlow 4s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #c4b5fd 0%, #a855f7 25%, #ffffff 50%, #a855f7 75%, #c4b5fd 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        /* Noise texture subtile via SVG inline */
        .noise::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.35;
        }
      `}</style>

      <main
        className="noise relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden"
        style={{ background: "#0a0a0f" }}
      >

        {/* ── Orbes de lumière en arrière-plan ─────────────────────────── */}
        <div
          className="glow pointer-events-none absolute"
          style={{
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
            top: "30%",
            right: "15%",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)",
            bottom: "20%",
            left: "10%",
          }}
        />

        {/* ── Contenu centré ───────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-xl w-full">

          {/* Logo */}
          <div className="anim-1 flex flex-col items-center gap-4">
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)",
              }}
            >
              <Zap className="h-10 w-10 text-white fill-white" />
            </div>

            {/* Nom */}
            <h1
              className="shimmer-text font-black tracking-tight"
              style={{ fontSize: "clamp(2.8rem, 10vw, 5rem)", lineHeight: 1 }}
            >
              FacturNow
            </h1>
          </div>

          {/* Ligne de séparation */}
          <div
            className="anim-2 w-16 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }}
          />

          {/* Tagline */}
          <p
            className="anim-3 font-medium leading-relaxed"
            style={{
              color: "#c4b5fd",
              fontSize: "clamp(1rem, 3vw, 1.25rem)",
              maxWidth: "420px",
            }}
          >
            La facturation intelligente,{" "}
            <span style={{ color: "#ffffff" }}>bientôt disponible.</span>
          </p>

          {/* Badge lancement */}
          <div
            className="anim-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              border: "1px solid rgba(124,58,237,0.4)",
              background: "rgba(124,58,237,0.12)",
              color: "#a78bfa",
              backdropFilter: "blur(8px)",
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            Lancement prévu — Printemps 2025
          </div>

          {/* Séparateur */}
          <div
            className="anim-4 w-full h-px mt-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {/* Email */}
          <div className="anim-5 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" style={{ color: "#6d28d9" }} />
            <a
              href="mailto:contact@facturnow.fr"
              className="text-sm transition-colors duration-200"
              style={{ color: "#7c3aed" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7c3aed")}
            >
              contact@facturnow.fr
            </a>
          </div>
        </div>

        {/* Ligne de grille décorative en bas */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: "linear-gradient(to top, rgba(124,58,237,0.06), transparent)",
          }}
        />
      </main>
    </>
  );
}
