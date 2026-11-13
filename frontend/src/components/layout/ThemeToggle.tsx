import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Tema = "light" | "dark";

// RF09: light/dark theme. The theme is a data-theme attribute on <html>; the CSS
// variables in index.css switch on it, so components need no theme logic.
export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light",
  );

  const alternar = () => {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    // Stored as a plain string (not JSON): index.html reads it before React loads.
    try {
      localStorage.setItem("estuda:theme", novo);
    } catch {
      /* storage unavailable: theme lasts until reload */
    }
    setTema(novo);
  };

  return (
    <Button variant="ghost" size="icon" onClick={alternar} aria-label="Alternar tema" title={tema === "dark" ? "Modo claro" : "Modo escuro"}>
      {tema === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
