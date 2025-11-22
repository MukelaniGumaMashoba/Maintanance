"use client";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRightLeft,
  Briefcase,
  Building2,
  Car,
  ChartBar,
  ChevronDown,
  ChevronsRight,
  ClipboardList,
  ClipboardListIcon,
  DockIcon,
  DollarSign,
  Fuel,
  GanttChart,
  Package,
  Phone,
  PlusSquare,
  ScrollText,
  Settings,
  ShieldAlert,
  Store,
  ToolCaseIcon,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { getReportCountsByCategory } from "@/lib/reports-data";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  role: "call centre" | "fleet manager" | "cost centre" | "customer";
}

type NavItem = {
  name: string;
  href: string;
  Icon: React.ElementType;
  hasSubMenu?: boolean;
  subMenu?: {
    name: string;
    href: string;
    icon: React.ElementType;
  }[];
};

interface SubMenuItem {
  name: string;
  href: string;
  icon?: React.ElementType;
}

// Role-based navigation configuration
const roleNavigation: Record<string, NavItem[]> = {
  "fleet manager": [
    { name: "Dashboard", href: "/dashboard", Icon: ChartBar },
    { name: "Job Cards", href: "/jobWorkShop", Icon: Briefcase },
    { name: "Drivers", href: "/drivers", Icon: Users },
    { name: "Vehicles", href: "/vehicles", Icon: Car },
    // { name: "Repair Management", href: "/ccenter", Icon: Building2 },
    { name: "System Settings", href: "/settings", Icon: Settings },
    { name: "User Management", href: "/userManagement", Icon: Users },
    {
      name: "Reports",
      href: "/reports",
      Icon: DockIcon,
      hasSubMenu: true,
      subMenu: [],
    },
  ],

  // Is the Admin and Part manager
  "call centre": [
    { name: "Dashboard", href: "/dashboard", Icon: ChartBar },
    { name: "Jobs", href: "/jobs", Icon: Briefcase },
    { name: "Workshop", href: "/callcenter", Icon: Store },
    {
      name: "Technicians Assignment",
      href: "/callcenter/technician",
      Icon: Wrench,
    },
    { name: "Suppliers", href: "/admin/suppliers", Icon: Building2 },
    { name: "Sublets", href: "/admin/sublets", Icon: ArrowRightLeft },
    { name: "Inventory", href: "/inventory", Icon: Package },
    {
      name: "Stock Levels",
      href: "/inventory/stock-levels",
      Icon: ClipboardList,
    },
    { name: "System Settings", href: "/settings", Icon: Settings },
  ],
};
const reportCategoryIcons: Record<string, React.ElementType> = {
  vehicles: Car,
  "vehicle-assignments": ArrowRightLeft,
  inspections: ClipboardListIcon,
  issues: ShieldAlert,
  service: Wrench,
  "work-orders": GanttChart,
  contacts: Users,
  parts: Package,
  fuel: Fuel,
};
export default function ProtectedLayout({
  children,
  role,
}: ProtectedLayoutProps) {
  const currentNavItems: NavItem[] =
    roleNavigation[role] || roleNavigation["fleet manager"];

  useEffect(() => {
    const reportCounts = getReportCountsByCategory();
    const reportMenuItem = currentNavItems.find(
      (item: { name: string }) => item.name === "Reports"
    );

    if (reportMenuItem) {
      reportMenuItem.subMenu = [
        { name: "All Reports", href: "/reports", icon: ScrollText },
        ...reportCounts.map((item) => ({
          name: `${item.category
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())} (${item.count})`,
          href: `/reports/${item.category}`,
          icon: reportCategoryIcons[item.category] || ChevronsRight,
        })),
      ];
    }
  }, [currentNavItems]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [navigation, setNavigation] = useState<any[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    // Get user role from cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const role = decodeURIComponent(getCookie("role") || "");
    const session = getCookie("session");

    console.log("Layout - Session cookie:", session ? "exists" : "missing");
    console.log("Layout - Role cookie:", role || "missing");

    if (role) {
      setUserRole(role);
      // Set navigation based on role
      const roleNav = roleNavigation[role as keyof typeof roleNavigation] || [];
      setNavigation(roleNav);
      console.log(
        "Layout - Navigation set for role:",
        role,
        "Items:",
        roleNav.length
      );
    } else {
      console.log("Layout - No role found, redirecting to login");
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  return (
    <SidebarProvider>
      <div className="bg-[#F4F4F4] w-full">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden w-full"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#1E1E1E] text-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          h-screen flex flex-col
        `}
        >
          {/* Header */}
          <div className="flex items-center justify-center p-4 bg-[#F57C00]">
            <img
              src="/klaver.png"
              alt="Klaver Plant Logo"
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold m-4">Klaver</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              if (item.hasSubMenu) {
                return (
                  <Collapsible
                    key={item.name}
                    defaultOpen={item.subMenu.some((subItem: any) =>
                      pathname.startsWith(subItem.href)
                    )}
                    className="list-none"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-200 hover:text-white hover:bg-[#F57C00]/30 px-3 py-2 rounded-lg transition"
                        >
                          <span>{item.name}</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                        {item.subMenu.map((subItem: SubMenuItem) => (
                          <SidebarMenuSubItem key={subItem.name}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname.startsWith(subItem.href)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                                pathname.startsWith(subItem.href)
                                  ? "bg-[#F57C00]/20 text-[#F57C00]"
                                  : "text-gray-400 hover:text-white hover:bg-[#F57C00]/20"
                              }`}
                            >
                              <Link href={subItem.href}>
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4" />
                                )}
                                <span>{subItem.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-[#F57C00]/20 text-[#F57C00] border-l-4 border-[#F57C00]"
                      : "text-gray-300 hover:bg-[#F57C00]/20 hover:text-white"
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-[#121212]">
            <div className="mb-3 text-xs text-gray-400 text-center">
              Role:{" "}
              {userRole
                ? userRole === "customer"
                  ? "External Workshop"
                  : userRole === "call centre"
                  ? "Administrator"
                  : userRole
                : "No User"}
            </div>
            <Button
              onClick={handleLogout}
              className="w-full bg-[#F57C00] hover:bg-[#e06f00] text-white font-semibold"
            >
              🚪 Logout
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="lg:ml-64 h-screen overflow-y-auto flex flex-col">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#F57C00]"
            >
              ☰
            </Button>
            <span className="text-sm font-medium text-gray-700">
              Welcome back
            </span>
          </div>

          {/* Page content */}
          <main className="p-6 flex-1 w-full">
            <Card className="p-6">{children}</Card>
            <Toaster />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
