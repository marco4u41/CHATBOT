export function StreamingIndicator() {
  return (
    <div className="flex justify-start animate-ax-fade-in">
      <div className="ax-glass--light rounded-2xl rounded-bl-md px-5 py-3.5">
        <div className="flex items-center gap-2" role="status" aria-label="Escribiendo">
          <span
            className="w-2 h-2 rounded-full bg-ax-accent-info animate-ax-pulse-wine"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-ax-accent-info/70 animate-ax-pulse-wine"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-ax-accent-info/40 animate-ax-pulse-wine"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
