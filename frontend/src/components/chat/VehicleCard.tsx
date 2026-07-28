import { useCallback, useRef, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  ChevronDown,
  Fuel,
  Gauge,
  Plus,
  Route,
  Settings2,
} from "lucide-react";
import type { VehicleScores } from "@/types/vehicle";
import { useGarageStore } from "@/stores/garageStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/utils/cn";

interface VehicleCardProps {
  brand: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  price_usd?: number | null;
  mileage_km?: number | null;
  scores?: VehicleScores;
}

const scoreAxes = [
  { key: "performance", label: "Potencia" },
  { key: "economy", label: "Economía" },
  { key: "safety", label: "Seguridad" },
  { key: "comfort", label: "Confort" },
  { key: "reliability", label: "Confiab." },
] as const;

export default function VehicleCard({
  brand,
  model,
  year,
  engine,
  transmission,
  fuel_type,
  price_usd,
  mileage_km,
  scores,
}: VehicleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showSpecs, setShowSpecs] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToGarage, isInGarage } = useGarageStore();
  const { addNotification } = useNotificationStore();
  const inGarage = isInGarage(brand, model, year);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  }, []);

  const resetTilt = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const handleAddToGarage = async () => {
    if (inGarage || isAdding) return;
    setIsAdding(true);
    const result = await addToGarage({
      brand,
      model,
      year,
      engine: engine ?? "",
      transmission: transmission ?? "",
      fuel_type: fuel_type ?? "",
      price_usd: price_usd ?? undefined,
      mileage_km: mileage_km ?? undefined,
      body_type: "",
      drive: "",
      condition: "",
      color: "",
      cylinders: undefined,
      passengers: undefined,
      consumption: "",
      notes: "",
      scores,
    });
    setIsAdding(false);

    if (result.ok) {
      addNotification("success", "Agregado al garaje", `${brand} ${model} ${year} fue agregado`);
    } else {
      addNotification("warning", "No se pudo agregar", result.error || "Error desconocido");
    }
  };

  const badges = [
    engine ? { label: engine, Icon: Gauge } : null,
    transmission ? { label: transmission, Icon: Settings2 } : null,
    fuel_type ? { label: fuel_type, Icon: Fuel } : null,
    mileage_km != null ? { label: `${mileage_km.toLocaleString("es-CO")} km`, Icon: Route } : null,
  ].filter((badge): badge is { label: string; Icon: typeof Gauge } => badge !== null);

  return (
    <div className="my-4" style={{ perspective: "900px" }}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className={cn(
          "ax-glass relative overflow-hidden rounded-2xl border border-white/[0.10]",
          "transition-[transform,box-shadow,border-color] duration-150 ease-out",
          "hover:border-ax-steel/30 hover:shadow-neon-blue animate-ax-scale-in",
        )}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-ax-steel/70 to-transparent" />
        <div className="relative p-5" style={{ transform: "translateZ(18px)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="ax-text-label text-ax-steel/70">Vehículo recomendado</p>
              <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-ax-text-primary">
                {brand} {model}
              </h3>
              <p className="ax-text-data mt-0.5 text-xs text-ax-text-muted">{year}</p>
            </div>
            {price_usd != null && (
              <span className="ax-badge flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ax-accent-success">
                <BadgeDollarSign className="h-3.5 w-3.5" />
                ${price_usd.toLocaleString("en-US")}
              </span>
            )}
          </div>

          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map(({ label, Icon }) => (
                <span
                  key={`${Icon.displayName}-${label}`}
                  className="ax-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-ax-text-secondary"
                >
                  <Icon className="h-3 w-3 text-ax-steel" />
                  {label}
                </span>
              ))}
            </div>
          )}

          {scores && (
            <div className="my-4 flex justify-center">
              <RadarChart scores={scores} size={150} />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAddToGarage}
              disabled={inGarage || isAdding}
              className={cn(
                "ax-focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                inGarage
                  ? "cursor-default border border-ax-accent-success/20 bg-ax-accent-success/10 text-ax-accent-success"
                  : "bg-ax-steel text-white shadow-neon-blue hover:bg-ax-steel-light active:scale-[0.98]",
              )}
            >
              {inGarage ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {inGarage ? "En el garaje" : isAdding ? "Agregando…" : "Añadir al garaje"}
            </button>
            <button
              type="button"
              onClick={() => setShowSpecs((current) => !current)}
              aria-expanded={showSpecs}
              className="ax-focus-ring ax-glass--light flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ax-text-secondary transition-colors hover:text-ax-text-primary"
            >
              Ficha
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showSpecs && "rotate-180")} />
            </button>
          </div>

          {showSpecs && (
            <div className="ax-glass--light mt-4 space-y-2 rounded-xl p-4 animate-ax-slide-up">
              <SpecRow label="Marca" value={brand} />
              <SpecRow label="Modelo" value={model} />
              <SpecRow label="Año" value={String(year)} />
              <SpecRow label="Motor" value={engine} />
              <SpecRow label="Transmisión" value={transmission} />
              <SpecRow label="Combustible" value={fuel_type} />
              <SpecRow
                label="Kilometraje"
                value={mileage_km != null ? `${mileage_km.toLocaleString("es-CO")} km` : undefined}
              />
              <SpecRow
                label="Precio"
                value={price_usd != null ? `$${price_usd.toLocaleString("en-US")} USD` : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-ax-text-muted">{label}</span>
      <span className="text-right font-medium text-ax-text-primary">{value || "No disponible"}</span>
    </div>
  );
}

function RadarChart({ scores, size }: { scores: VehicleScores; size: number }) {
  const center = size / 2;
  const radius = size * 0.31;
  const maxScore = Math.max(...scoreAxes.map(({ key }) => scores[key] ?? 0)) <= 10 ? 10 : 100;
  const point = (index: number, value: number, extraRadius = 0) => {
    const angle = index * ((2 * Math.PI) / scoreAxes.length) - Math.PI / 2;
    const distance = extraRadius || (Math.max(0, Math.min(value, maxScore)) / maxScore) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };
  const dataPoints = scoreAxes
    .map(({ key }, index) => {
      const position = point(index, scores[key] ?? 0);
      return `${position.x},${position.y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Puntuaciones del vehículo">
      <defs>
        <linearGradient id={`radar-${brandSafeId(dataPoints)}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#567FA5" stopOpacity="0.32" />
          <stop offset="1" stopColor="#B59A62" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={scoreAxes.map((_, index) => {
            const position = point(index, maxScore, radius * level);
            return `${position.x},${position.y}`;
          }).join(" ")}
          fill="none"
          stroke="var(--ax-glass-border)"
          strokeWidth="0.75"
        />
      ))}
      <polygon
        points={dataPoints}
        fill={`url(#radar-${brandSafeId(dataPoints)})`}
        stroke="#6d96bb"
        strokeWidth="1.5"
      />
      {scoreAxes.map(({ key, label }, index) => {
        const dot = point(index, scores[key] ?? 0);
        const text = point(index, maxScore, radius + 18);
        return (
          <g key={key}>
            <circle cx={dot.x} cy={dot.y} r="2.5" fill="#B59A62" stroke="#567FA5" strokeWidth="2" />
            <text
              x={text.x}
              y={text.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--ax-text-muted)"
              fontSize="8"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function brandSafeId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}
