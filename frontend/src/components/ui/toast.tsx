import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { uid } from "@/lib/utils";

interface Toast {
  id: string;
  mensagem: string;
}

const ToastContext = createContext<((mensagem: string) => void) | null>(null);

const DURACAO_MS = 2800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensagem: string) => {
    const id = uid();
    setToasts((atual) => [...atual, { id, mensagem }]);
    setTimeout(() => setToasts((atual) => atual.filter((t) => t.id !== id)), DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (mensagem: string) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}
