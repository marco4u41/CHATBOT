import { useState } from "react";
import { cn } from "@/utils/cn";
import { DIAGNOSIS_CATEGORIES } from "@/config/constants";

interface DiagnosisFormProps {
  onSubmit: (data: {
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_year: number;
    symptoms: string[];
    category?: string;
  }) => void;
  disabled?: boolean;
}

export function DiagnosisForm({ onSubmit, disabled = false }: DiagnosisFormProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [category, setCategory] = useState("");

  function addSymptom() {
    const trimmed = symptomInput.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed]);
      setSymptomInput("");
    }
  }

  function removeSymptom(symptom: string) {
    setSymptoms((prev) => prev.filter((s) => s !== symptom));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (brand && model && symptoms.length > 0) {
      onSubmit({
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_year: year,
        symptoms,
        category: category || undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <input
          type="text"
          placeholder="Marca"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
          required
        />
        <input
          type="text"
          placeholder="Modelo"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
          required
        />
        <input
          type="number"
          placeholder="Ano"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
          min={1900}
          max={2100}
        />
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white/70"
      >
        <option value="" className="bg-[#0a0c10]">
          Categoria (opcional)
        </option>
        {DIAGNOSIS_CATEGORIES.map((cat) => (
          <option key={cat} value={cat} className="bg-[#0a0c10]">
            {cat}
          </option>
        ))}
      </select>

      <div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe un sintoma..."
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSymptom();
              }
            }}
            className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
          />
          <button
            type="button"
            onClick={addSymptom}
            className="skeuo-button rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/70"
          >
            +
          </button>
        </div>

        {symptoms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {symptoms.map((symptom) => (
              <span
                key={symptom}
                className="glass-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-neon-blue/80"
              >
                {symptom}
                <button
                  type="button"
                  onClick={() => removeSymptom(symptom)}
                  className="hover:text-neon-red transition-colors"
                  aria-label={`Eliminar ${symptom}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || !brand || !model || symptoms.length === 0}
        className={cn(
          "rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          brand && model && symptoms.length > 0 && !disabled
            ? "neon-button text-neon-blue"
            : "skeuo-button text-white/30",
        )}
      >
        Diagnosticar
      </button>
    </form>
  );
}
