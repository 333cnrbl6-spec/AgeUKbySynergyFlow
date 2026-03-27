import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, className }) {
  return (
    <div className={cn("bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-accent">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("font-semibold", trend >= 0 ? "text-emerald-600" : "text-destructive")}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
          <span className="text-muted-foreground">{trendLabel || "vs last month"}</span>
        </div>
      )}
    </div>
  );
}