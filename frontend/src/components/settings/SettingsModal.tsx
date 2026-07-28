import { useState } from "react";
import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalBody,
} from "@/components/design-system/GlassModal";
import { useNotificationStore } from "@/stores/notificationStore";
import { apiClient } from "@/api/client";
import { cn } from "@/utils/cn";
import { setStoredTheme, getStoredTheme } from "@/utils/theme";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type SettingsTab = "theme" | "font" | "password";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("theme");
  const [theme, setTheme] = useState<"dark" | "light" | "system">(() => {
    return getStoredTheme();
  });
  const [fontSize, setFontSize] = useState<"small" | "normal" | "large">(() => {
    return (localStorage.getItem("ax-font-size") as "small" | "normal" | "large") || "normal";
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const { addNotification } = useNotificationStore();

  const handleThemeChange = (t: "dark" | "light" | "system") => {
    setTheme(t);
    setStoredTheme(t);
    addNotification("success", "Tema actualizado", `Tema cambiado a ${t === "dark" ? "oscuro" : t === "light" ? "claro" : "sistema"}`);
  };

  const handleFontChange = (f: "small" | "normal" | "large") => {
    setFontSize(f);
    localStorage.setItem("ax-font-size", f);
    document.documentElement.style.fontSize =
      f === "small" ? "14px" : f === "large" ? "18px" : "16px";
  };

  const handlePasswordChange = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!currentPassword.trim()) {
      setPwError("Ingresa tu contraseña actual");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmNew) {
      setPwError("Las contraseñas no coinciden");
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setPwLoading(true);
    const res = await apiClient.post<{ success: boolean; error?: string }>(
      "/auth/change-password",
      { current_password: currentPassword, new_password: newPassword },
    );
    setPwLoading(false);

    if (res.success) {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
      addNotification("success", "Contraseña actualizada", "Tu contraseña ha sido cambiada exitosamente");
    } else {
      setPwError(res.error || "No se pudo cambiar la contraseña");
    }
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "theme", label: "Tema" },
    { key: "font", label: "Tamaño" },
    { key: "password", label: "Contraseña" },
  ];

  const themes: { value: "dark" | "light" | "system"; label: string; desc: string }[] = [
    { value: "dark", label: "Oscuro", desc: "Tema predeterminado" },
    { value: "light", label: "Claro", desc: "Modo diurno" },
    { value: "system", label: "Sistema", desc: "Según tu dispositivo" },
  ];

  const fontSizes: { value: "small" | "normal" | "large"; label: string; desc: string }[] = [
    { value: "small", label: "Pequeño", desc: "14px" },
    { value: "normal", label: "Normal", desc: "16px" },
    { value: "large", label: "Grande", desc: "18px" },
  ];

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent size="md">
        <GlassModalHeader>
          <GlassModalTitle>Configuración</GlassModalTitle>
        </GlassModalHeader>

        <div className="px-6 pt-3 border-b border-[var(--ax-glass-border)]">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "px-3 py-2 text-xs font-medium rounded-t-lg transition-colors",
                  activeTab === t.key
                    ? "text-[var(--ax-text)] bg-[var(--ax-glass-highlight)] border-b-2 border-ax-gold/50"
                    : "text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <GlassModalBody>
          {activeTab === "theme" && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--ax-text-muted)] mb-3">Selecciona tu tema preferido</p>
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all",
                    theme === t.value
                      ? "bg-ax-wine/15 border border-ax-wine/25 text-[var(--ax-text)]"
                      : "bg-[var(--ax-glass-highlight)] border border-transparent text-[var(--ax-text-muted)] hover:bg-[var(--ax-glass-bg-light)] hover:text-[var(--ax-text-secondary)]"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-[11px] text-[var(--ax-text-muted)] mt-0.5">{t.desc}</p>
                  </div>
                  {theme === t.value && (
                    <div className="w-2 h-2 rounded-full bg-ax-gold/70" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === "font" && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--ax-text-muted)] mb-3">Tamaño del texto de la interfaz</p>
              {fontSizes.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFontChange(f.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all",
                    fontSize === f.value
                      ? "bg-ax-wine/15 border border-ax-wine/25 text-[var(--ax-text)]"
                      : "bg-[var(--ax-glass-highlight)] border border-transparent text-[var(--ax-text-muted)] hover:bg-[var(--ax-glass-bg-light)] hover:text-[var(--ax-text-secondary)]"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-[11px] text-[var(--ax-text-muted)] mt-0.5">{f.desc}</p>
                  </div>
                  {fontSize === f.value && (
                    <div className="w-2 h-2 rounded-full bg-ax-gold/70" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--ax-text-muted)]">Cambia tu contraseña de acceso</p>

              <div>
                <label className="text-xs text-[var(--ax-text-muted)] mb-1.5 block">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-[var(--ax-glass-highlight)] border border-[var(--ax-glass-border)] text-sm text-[var(--ax-text)] placeholder:text-[var(--ax-text-muted)] outline-none focus:border-ax-wine/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)]"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--ax-text-muted)] mb-1.5 block">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-[var(--ax-glass-highlight)] border border-[var(--ax-glass-border)] text-sm text-[var(--ax-text)] placeholder:text-[var(--ax-text-muted)] outline-none focus:border-ax-wine/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)]"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--ax-text-muted)] mb-1.5 block">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmNew}
                    onChange={(e) => setConfirmNew(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-[var(--ax-glass-highlight)] border border-[var(--ax-glass-border)] text-sm text-[var(--ax-text)] placeholder:text-[var(--ax-text-muted)] outline-none focus:border-ax-wine/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)]"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pwError && (
                <p className="text-xs text-red-400/80 bg-red-400/10 px-3 py-2 rounded-lg">
                  {pwError}
                </p>
              )}

              {pwSuccess && (
                <p className="text-xs text-green-400/80 bg-green-400/10 px-3 py-2 rounded-lg">
                  Contraseña actualizada exitosamente
                </p>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={pwLoading}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-medium transition-all",
                  pwLoading
                    ? "bg-[var(--ax-glass-highlight)] text-[var(--ax-text-muted)] cursor-not-allowed"
                    : "bg-gradient-to-r from-ax-wine/60 to-ax-wine/40 text-white hover:from-ax-wine/70 hover:to-ax-wine/50 border border-ax-wine/25"
                )}
              >
                {pwLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Cambiar contraseña"
                )}
              </button>
            </div>
          )}
        </GlassModalBody>
      </GlassModalContent>
    </GlassModal>
  );
}
