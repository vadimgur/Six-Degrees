"use client";

import Image from "next/image";
import { IMAGE_BASE } from "@/lib/tmdb";
import type { PathStep } from "@/lib/pathfinder";

interface PathGraphProps {
  path: PathStep[];
}

function ActorNode({
  step,
  highlight,
}: {
  step: PathStep;
  highlight: boolean;
}) {
  const imgSrc = step.imagePath
    ? `${IMAGE_BASE}/w185${step.imagePath}`
    : null;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px] max-w-[120px]">
      <div
        className={`relative w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg flex-shrink-0 ${
          highlight
            ? "border-cinema-gold shadow-cinema-gold/30"
            : "border-cinema-border/60 shadow-black/40"
        }`}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={step.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full bg-cinema-border flex items-center justify-center text-3xl">
            🎭
          </div>
        )}
      </div>
      <p
        className={`text-center text-xs font-semibold leading-tight max-w-[110px] ${
          highlight ? "text-cinema-gold" : "text-white"
        }`}
      >
        {step.name}
      </p>
      <span className="text-[10px] text-cinema-muted uppercase tracking-wider">
        Actor
      </span>
    </div>
  );
}

function MovieNode({ step }: { step: PathStep }) {
  const imgSrc = step.imagePath
    ? `${IMAGE_BASE}/w185${step.imagePath}`
    : null;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[90px] max-w-[110px]">
      <div className="relative w-[72px] h-[108px] rounded-lg overflow-hidden border-2 border-cinema-border shadow-lg shadow-black/50 flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={step.name}
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <div className="w-full h-full bg-cinema-border flex items-center justify-center text-3xl">
            🎬
          </div>
        )}
      </div>
      <p className="text-center text-xs text-slate-300 leading-tight max-w-[100px] font-medium">
        {step.name}
      </p>
      <span className="text-[10px] text-cinema-muted uppercase tracking-wider">
        Movie
      </span>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center flex-shrink-0 px-1 self-center mt-[-24px]">
      <svg
        width="40"
        height="20"
        viewBox="0 0 40 20"
        fill="none"
        className="connector-animate"
      >
        <line
          x1="0"
          y1="10"
          x2="32"
          y2="10"
          stroke="#f5c842"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <polygon points="32,5 40,10 32,15" fill="#f5c842" opacity="0.8" />
      </svg>
    </div>
  );
}

export default function PathGraph({ path }: PathGraphProps) {
  const degrees = Math.floor((path.length - 1) / 2);

  const degreeLabel =
    degrees === 0
      ? "Same person!"
      : degrees === 1
      ? "1 degree of separation"
      : `${degrees} degrees of separation`;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-cinema-border" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cinema-gold/10 border border-cinema-gold/30">
          <span className="text-cinema-gold text-lg">✦</span>
          <span className="text-cinema-gold font-semibold text-sm">
            {degreeLabel}
          </span>
          <span className="text-cinema-gold text-lg">✦</span>
        </div>
        <div className="flex-1 h-px bg-cinema-border" />
      </div>

      {/* Steps summary */}
      <p className="text-center text-cinema-muted text-xs mb-8">
        {path.length} nodes &bull;{" "}
        {path.filter((s) => s.type === "movie").length} movie
        {path.filter((s) => s.type === "movie").length !== 1 ? "s" : ""}
        {" · "}
        {path.filter((s) => s.type === "actor").length} actor
        {path.filter((s) => s.type === "actor").length !== 1 ? "s" : ""}
      </p>

      {/* Graph */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max mx-auto px-4">
          {path.map((step, index) => (
            <div key={`${step.type}-${step.id}-${index}`} className="flex items-center">
              {/* Connector before node (except first) */}
              {index > 0 && <Connector />}

              {step.type === "actor" ? (
                <ActorNode
                  step={step}
                  highlight={index === 0 || index === path.length - 1}
                />
              ) : (
                <MovieNode step={step} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Path text description */}
      <div className="mt-8 p-4 rounded-xl bg-cinema-card border border-cinema-border">
        <p className="text-xs text-cinema-muted font-semibold uppercase tracking-wider mb-2">
          Connection path
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          {path.map((step, index) => (
            <span key={`text-${step.type}-${step.id}-${index}`}>
              <span
                className={
                  step.type === "actor"
                    ? index === 0 || index === path.length - 1
                      ? "text-cinema-gold font-semibold"
                      : "text-white font-medium"
                    : "text-slate-400 italic"
                }
              >
                {step.name}
              </span>
              {index < path.length - 1 && (
                <span className="text-cinema-border mx-2">→</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
