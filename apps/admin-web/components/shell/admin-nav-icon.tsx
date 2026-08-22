"use client";

import {
  BarChart3,
  Building2,
  HeartPulse,
  LayoutDashboard,
  MonitorSmartphone,
  Settings,
  Shield,
  Ticket,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { AdminNavIcon } from "@/lib/admin-nav";

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  zap: Zap,
  heartPulse: HeartPulse,
  building2: Building2,
  barChart3: BarChart3,
  ticket: Ticket,
  shield: Shield,
  settings: Settings,
  layoutDashboard: LayoutDashboard,
  user: User,
  monitorSmartphone: MonitorSmartphone,
};

export function AdminNavIconView({
  name,
  className,
}: {
  name: AdminNavIcon;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden />;
}
