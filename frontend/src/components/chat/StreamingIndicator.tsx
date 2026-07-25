export function StreamingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="liquid-glass-panel-dense rounded-2xl rounded-bl-md px-5 py-3.5">
        <div className="flex items-center gap-2" role="status" aria-label="Escribiendo">
          <span
            className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-dot"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-neon-blue/70 animate-pulse-dot"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-neon-blue/40 animate-pulse-dot"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
