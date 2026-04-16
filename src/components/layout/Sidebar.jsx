import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Wrench, Calendar, Receipt, 
  UserCog, Menu, X, ChevronRight, Heart, Truck, Building2,
  PoundSterling, PhoneIncoming, Handshake, Shield, BarChart3, Link2, Clock, Network, MapPin,
  Award, Book, Share2, Stethoscope, ClipboardList, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { getNavItemsForRole, ROLE_LABELS } from "@/lib/rolePermissions";

const ALL_NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Session Register", path: "/session-list", icon: ClipboardList },
  { label: "Community Exchange", path: "/exchange", icon: Heart },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Prospects", path: "/prospects", icon: Users },
  { label: "Jobs", path: "/jobs", icon: Wrench },
  { label: "Calendar", path: "/calendar", icon: Calendar },
  { label: "Activities", path: "/activities", icon: Calendar },
  { label: "Referrals", path: "/referrals", icon: PhoneIncoming },
  { label: "Information Hub", path: "/information", icon: Book },
  { label: "Health Services", path: "/health", icon: Stethoscope },
  { label: "Services & Map", path: "/services", icon: Building2 },
  { label: "Service Map", path: "/map", icon: MapPin },
  { label: "Facilities", path: "/facilities", icon: Building2 },
  { label: "Invoices", path: "/invoices", icon: Receipt },
  { label: "Suppliers", path: "/suppliers", icon: Truck },
  { label: "Grants & Funding", path: "/grants", icon: PoundSterling },
  { label: "Partners", path: "/partners", icon: Handshake },
  { label: "Data Partnerships", path: "/partnerships", icon: Network },
  { label: "Compliance", path: "/compliance", icon: Shield },
  { label: "Impact & Reports", path: "/impact", icon: Award },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Timesheets", path: "/timesheets", icon: Clock },
  { label: "Staff", path: "/staff", icon: UserCog },
  { label: "Staff Calendar", path: "/staff-calendar", icon: Calendar },
  { label: "Xero", path: "/xero", icon: Link2, xero: true },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getNavItemsForRole(user?.role, ALL_NAV_ITEMS);
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || 'Staff';

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-heading font-bold text-white text-sm leading-tight">Age UK Bolton</h1>
              <p className="text-xs text-white/60 leading-tight">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                active 
                  ? "bg-sidebar-accent text-white font-medium" 
                  : "text-white/70 hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              {item.xero ? (
                <span className="w-4 h-4 flex-shrink-0 rounded-sm flex items-center justify-center text-xs font-bold italic" style={{ backgroundColor: '#13B5EA', color: 'white', fontSize: '10px' }}>x</span>
              ) : (
                <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-secondary")} />
              )}
              {!collapsed && (
                <>
                  <span className={cn("text-sm", item.xero && "font-medium")} style={item.xero ? { color: '#13B5EA' } : {}}>
                    {item.label}
                  </span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="text-xs text-white/40 leading-relaxed">
              <p className="font-medium text-white/80">{user?.full_name || 'Staff Member'}</p>
              <p className="text-white/50">{roleLabel}</p>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => logout()} className="text-white/40 hover:text-white/70 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", collapsed ? "" : "rotate-180")} />
        </button>
      </aside>
    </>
  );
}