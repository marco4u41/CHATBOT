import { useState, useEffect, useRef, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/cn";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register, error, clearError, isLoading, completeAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    !isLoading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    if (password !== confirmPassword) return;
    const ok = await register(email.trim(), password, confirmPassword, displayName.trim() || undefined);
    if (ok) {
      setSuccess(true);
      timerRef.current = setTimeout(() => {
        completeAuth();
      }, 1500);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ax-bg-deep px-4">
        <div className="ax-ambient-bg" aria-hidden="true" />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ax-accent-primary/20 to-ax-gold/10 flex items-center justify-center border border-ax-accent-primary/20">
              <svg className="h-8 w-8 text-ax-accent-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 20.105V4.875A1.875 1.875 0 0 1 5.625 3h12.75A1.875 1.875 0 0 1 20.25 4.875v10.5A1.875 1.875 0 0 1 18.375 17.25H8.655l-3.46 2.595A.75.75 0 0 1 4 19.256Z" />
              </svg>
            </div>
            <h1 className="ax-text-heading text-2xl text-ax-text-primary">AutoExpert AI</h1>
            <p className="text-sm text-ax-text-muted mt-1">Asistente Automotriz</p>
          </div>
          <div className="ax-glass rounded-2xl border border-white/[0.08] p-6 shadow-ax-modal text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="ax-text-heading text-lg text-ax-text-primary mb-1">Cuenta creada</h2>
            <p className="text-xs text-ax-text-muted">Ingresando al chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ax-bg-deep px-4">
      <div className="ax-ambient-bg" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ax-accent-primary/20 to-ax-gold/10 flex items-center justify-center border border-ax-accent-primary/20">
            <svg className="h-8 w-8 text-ax-accent-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 20.105V4.875A1.875 1.875 0 0 1 5.625 3h12.75A1.875 1.875 0 0 1 20.25 4.875v10.5A1.875 1.875 0 0 1 18.375 17.25H8.655l-3.46 2.595A.75.75 0 0 1 4 19.256Z" />
            </svg>
          </div>
          <h1 className="ax-text-heading text-2xl text-ax-text-primary">AutoExpert AI</h1>
          <p className="text-sm text-ax-text-muted mt-1">Asistente Automotriz</p>
        </div>

        {/* Register Form */}
        <div className="ax-glass rounded-2xl border border-white/[0.08] p-6 shadow-ax-modal">
          <h2 className="ax-text-heading text-lg text-ax-text-primary mb-1">Crear cuenta</h2>
          <p className="text-xs text-ax-text-muted mb-6">Regístrate para guardar tu historial</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-ax-accent-danger/[0.06] border border-ax-accent-danger/20">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-ax-text-secondary mb-1.5">
                Correo electrónico *
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={cn(
                  "w-full rounded-xl px-4 py-2.5 text-sm",
                  "bg-white/[0.04] border border-white/[0.08]",
                  "text-ax-text-primary placeholder:text-ax-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-ax-accent-primary/40 focus:border-ax-accent-primary/40",
                  "transition-all duration-200",
                )}
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-ax-text-secondary mb-1.5">
                Nombre para mostrar
              </label>
              <input
                id="reg-name"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className={cn(
                  "w-full rounded-xl px-4 py-2.5 text-sm",
                  "bg-white/[0.04] border border-white/[0.08]",
                  "text-ax-text-primary placeholder:text-ax-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-ax-accent-primary/40 focus:border-ax-accent-primary/40",
                  "transition-all duration-200",
                )}
                placeholder="Tu nombre (opcional)"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-ax-text-secondary mb-1.5">
                Contraseña *
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl px-4 py-2.5 text-sm",
                  "bg-white/[0.04] border border-white/[0.08]",
                  "text-ax-text-primary placeholder:text-ax-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-ax-accent-primary/40 focus:border-ax-accent-primary/40",
                  "transition-all duration-200",
                )}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold text-ax-text-secondary mb-1.5">
                Confirmar contraseña *
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl px-4 py-2.5 text-sm",
                  "bg-white/[0.04] border",
                  passwordMismatch ? "border-ax-accent-danger/50" : "border-white/[0.08]",
                  "text-ax-text-primary placeholder:text-ax-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-ax-accent-primary/40 focus:border-ax-accent-primary/40",
                  "transition-all duration-200",
                )}
                placeholder="Repite tu contraseña"
              />
              {passwordMismatch && (
                <p className="text-[10px] text-red-400 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200",
                !canSubmit
                  ? "bg-ax-surface-light text-ax-text-muted cursor-not-allowed"
                  : "bg-gradient-to-br from-ax-accent-primary to-ax-accent-primary/80 text-white border border-ax-accent-primary/30 shadow-ax-glow-wine hover:brightness-110 active:scale-[0.97]",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-ax-text-muted">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-ax-accent-primary hover:underline font-semibold"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
