import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { RotaProtegida } from "@/features/auth/RotaProtegida";
import { CalendarioPage } from "@/features/calendario/CalendarioPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { DisciplinasPage } from "@/features/disciplinas/DisciplinasPage";
import { GruposPage } from "@/features/grupos/GruposPage";
import { PomodoroPage } from "@/features/pomodoro/PomodoroPage";
import { PomodoroProvider } from "@/features/pomodoro/PomodoroProvider";
import { TarefasPage } from "@/features/tarefas/TarefasPage";
import { DadosProvider } from "./DadosProvider";

// Provider order matters: data needs the logged-in user, and the Pomodoro
// needs the data (to save sessions), so both live inside the protected route.
function AreaLogada() {
  return (
    <RotaProtegida>
      <DadosProvider>
        <PomodoroProvider>
          <AppLayout />
        </PomodoroProvider>
      </DadosProvider>
    </RotaProtegida>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AreaLogada />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/disciplinas" element={<DisciplinasPage />} />
              <Route path="/tarefas" element={<TarefasPage />} />
              <Route path="/calendario" element={<CalendarioPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/grupos" element={<GruposPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
