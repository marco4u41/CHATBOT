import { useState, useRef, useCallback } from "react";
import type { VehicleScores } from "@/types/vehicle";
import { useGarageStore } from "@/stores/garageStore";
import { safeDisplay } from "@/utils/specNormalization";
import { cn } from "@/utils/cn";

interface CarCardProps {
  brand: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  price_usd?: number;
  scores?: VehicleScores;
}

export function CarCard({
  brand,
  model,
  year,
  engine,
  transmission,
  fuel_type,
  price_usd,
  scores,
}: CarCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [showSpecs, setShowSpecs] = useState(false);
  const { addToGarage, isInGarage } = useGarageStore();

  const inGarage = isInGarage(brand, model, year);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTilt({ rotateX, rotateY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  async function handleAddToGarage() {
    const result = await addToGarage({
      brand,
      model,
      year,
      engine,
      transmission,
      fuel_type,
      price_usd,
      scores,
    });
    if (!result.ok) return;
  }

  const badgeData: { label: string; icon: string }[] = [];
  if (engine) badgeData.push({ label: safeDisplay(engine), icon: "⚙" });
  if (transmission) badgeData.push({ label: safeDisplay(transmission), icon: "⟳" });
  if (fuel_type) badgeData.push({ label: safeDisplay(fuel_type), icon: "⛽" });
  if (price_usd != null) badgeData.push({ label: `$${price_usd.toLocaleString()}`, icon: "💰" });

  return (
    <div className="perspective-800">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "ax-glass rounded-2xl overflow-hidden",
          "transition-all duration-150 ease-out",
          "animate-ax-scale-in",
        )}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        }}
      >
        {/* Header glow line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-ax-accent-info/50 to-transparent" />

        <div className="p-5">
          {/* Title */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-ax-text-primary tracking-tight">
                {brand} {model}
              </h3>
              <p className="text-sm text-ax-text-muted font-mono mt-0.5">{year}</p>
            </div>
            {price_usd && (
              <span className="text-ax-accent-success font-mono text-sm font-semibold px-2 py-1 ax-badge rounded-lg">
                ${price_usd.toLocaleString()}
              </span>
            )}
          </div>

          {/* Badges */}
          {badgeData.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {badgeData.map((badge) => (
                <span
                  key={badge.label}
                  className="ax-badge rounded-full px-2.5 py-1 text-xs text-ax-text-secondary font-medium"
                >
                  <span className="mr-1">{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Radar Chart (SVG) */}
          {scores && (
            <div className="flex justify-center my-3">
              <RadarChart scores={scores} size={140} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddToGarage}
              disabled={inGarage}
              className={cn(
                "flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                inGarage
                  ? "bg-ax-surface-light text-ax-text-muted border border-ax-border-subtle cursor-not-allowed"
                  : "bg-ax-accent-info text-white hover:bg-ax-accent-info/90",
              )}
            >
              {inGarage ? "En el Garaje" : "+ Garaje"}
            </button>
            <button
              onClick={() => setShowSpecs(!showSpecs)}
              className={cn(
                "rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                "ax-glass text-ax-text-secondary hover:text-ax-text-primary",
              )}
            >
              {showSpecs ? "Ocultar" : "Ficha"}
            </button>
          </div>

          {/* Expandable Specs */}
          {showSpecs && (
            <div className="mt-4 animate-ax-slide-up">
              <div className="ax-glass--light rounded-xl p-4 space-y-2">
                <SpecRow label="Marca" value={safeDisplay(brand)} />
                <SpecRow label="Modelo" value={safeDisplay(model)} />
                <SpecRow label="Año" value={String(year)} />
                <SpecRow label="Motor" value={safeDisplay(engine)} />
                <SpecRow label="Transmisión" value={safeDisplay(transmission)} />
                <SpecRow label="Combustible" value={safeDisplay(fuel_type)} />
                <SpecRow label="Precio" value={price_usd != null ? `$${price_usd.toLocaleString()}` : "No disponible"} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-ax-text-muted">{label}</span>
      <span className="text-ax-text-primary font-medium">{value}</span>
    </div>
  );
}

function RadarChart({ scores, size }: { scores: VehicleScores; size: number }) {
  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const axes = [
    { key: "performance", label: "Potencia" },
    { key: "economy", label: "Economía" },
    { key: "safety", label: "Seguridad" },
    { key: "comfort", label: "Confort" },
    { key: "reliability", label: "Confiab." },
  ] as const;
  const total = axes.length;
  const angleStep = (2 * Math.PI) / total;

  function getPoint(index: number, value: number) {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  const polygonPoints = axes
    .map((axis, i) => {
      const val = scores[axis.key as keyof VehicleScores] ?? 5;
      const pt = getPoint(i, val);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
        const pts = axes
          .map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + radius * scale * Math.cos(angle)},${center + radius * scale * Math.sin(angle)}`;
          })
          .join(" ");
        return (
          <polygon
            key={scale}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(0, 240, 255, 0.12)"
        stroke="rgba(0, 240, 255, 0.6)"
        strokeWidth="1.5"
      />

      {/* Data dots */}
      {axes.map((axis, i) => {
        const val = scores[axis.key as keyof VehicleScores] ?? 5;
        const pt = getPoint(i, val);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="2.5"
            fill="#00f0ff"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="4"
          />
        );
      })}

      {/* Labels */}
      {axes.map((axis, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelR = radius + 14;
        return (
          <text
            key={i}
            x={center + labelR * Math.cos(angle)}
            y={center + labelR * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ax-text-muted text-[8px]"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}