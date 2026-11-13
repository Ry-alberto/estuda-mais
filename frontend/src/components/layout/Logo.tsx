import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("grid size-9 place-items-center rounded-xl", claro ? "bg-white/20 text-white" : "bg-primary text-white")}>
        <GraduationCap className="size-5" />
      </span>
      <span className={cn("font-heading text-lg font-bold", claro ? "text-white" : "text-foreground")}>
        Estuda<span className={claro ? "text-white" : "text-success"}>+</span>
      </span>
    </span>
  );
}
