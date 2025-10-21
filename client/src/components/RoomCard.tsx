import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export const RoomCard = ({ title, description, icon, onClick, variant = "primary" }: RoomCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-8 transition-all duration-300",
        "bg-card border-2 border-border hover:border-primary",
        "hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
        "hover:scale-105 hover:-translate-y-1",
        "text-left w-full max-w-md"
      )}
    >
      <div className="relative z-10">
        <div className={cn(
          "mb-4 inline-flex p-4 rounded-xl transition-colors duration-300",
          variant === "primary" ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground" : "bg-secondary/20 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground"
        )}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
        variant === "primary" ? "bg-gradient-to-br from-primary to-transparent" : "bg-gradient-to-br from-secondary to-transparent"
      )} />
    </button>
  );
};