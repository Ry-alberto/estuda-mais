import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// shadcn/ui Dialog built on Radix: focus trap, Esc to close and aria attributes for free.
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-2xl"
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-md p-1 text-muted hover:bg-surface-2" aria-label="Fechar">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
