import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", {
  variants: {
    variant: {
      ALTA: "bg-danger-soft text-danger",
      MEDIA: "bg-warning-soft text-warning-text",
      BAIXA: "border border-border bg-surface-2 text-muted",
      PROVA: "bg-primary-soft text-primary",
      ENTREGA: "bg-success-soft text-success",
      TAREFA: "border border-border bg-surface-2 text-muted",
    },
  },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
