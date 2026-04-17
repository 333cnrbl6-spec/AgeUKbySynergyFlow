import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function NetworkStatusBadge({ collapsed }) {
  const { data: configs = [] } = useQuery({
    queryKey: ["networkConfig"],
    queryFn: () => base44.entities.NetworkConfig.list(),
    staleTime: 60000,
  });

  const status = configs[0]?.connection_status || "disconnected";

  const cfg = {
    connected:    { icon: Wifi,         colour: "text-green-400",  dot: "bg-green-400", label: "Hub Connected" },
    disconnected: { icon: WifiOff,      colour: "text-white/30",   dot: "bg-white/20",  label: "Hub Not Connected" },
    error:        { icon: AlertCircle,  colour: "text-red-400",    dot: "bg-red-400",   label: "Hub Error" },
  }[status] || { icon: WifiOff, colour: "text-white/30", dot: "bg-white/20", label: "Not Connected" };

  const Icon = cfg.icon;

  return (
    <Link
      to="/network"
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        "text-white/60 hover:bg-sidebar-accent/50 hover:text-white"
      )}
      title={cfg.label}
    >
      <div className="relative flex-shrink-0">
        <Icon className={cn("w-4 h-4", cfg.colour)} />
        <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-sidebar", cfg.dot)} />
      </div>
      {!collapsed && (
        <span className="text-xs truncate">{cfg.label}</span>
      )}
    </Link>
  );
}