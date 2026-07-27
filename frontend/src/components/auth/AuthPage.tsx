import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  if (mode === "register") {
    return <RegisterPage onSwitchToLogin={() => setMode("login")} />;
  }
  return <LoginPage onSwitchToRegister={() => setMode("register")} />;
}
