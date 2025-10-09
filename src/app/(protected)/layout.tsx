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
    { name: "Workshop Jobs", href: "/jobWorkShop", Icon: Briefcase },
    { name: "Drivers", href: "/drivers", Icon: Users },
    { name: "Vehicles", href: "/vehicles", Icon: Car },
    { name: "Workshop", href: "/internalWorkshop", Icon: Store },
    { name: "Repair Management", href: "/ccenter", Icon: Building2 },
    {
      name: "Reports",
      href: "/reports",
      Icon: DockIcon,
      hasSubMenu: true,
      subMenu: [], // This is now valid
    },
    { name: "System Settings", href: "/settings", Icon: Settings },
  ],
  "call centre": [
    { name: "Dashboard", href: "/dashboard", Icon: ChartBar },
    { name: "Jobs", href: "/jobs", Icon: Briefcase },
    { name: "Workshop", href: "/callcenter", Icon: Store },
    {
      name: "Technicians Assignment",
      href: "/callcenter/technician",
      Icon: Wrench,
    },
    { name: "Workshop Vehicles", href: "/callcenter/breakdowns", Icon: Truck },
    { name: "Repair Management", href: "/ccenter", Icon: Building2 },
    { name: "Inventory", href: "/inventory", Icon: Package },
    { name: "System Settings", href: "/settings", Icon: Settings },
  ],
  customer: [
    { name: "Dashboard", href: "/dashboard", Icon: ChartBar },
    { name: "Jobs", href: "/jobs", Icon: Briefcase },
    { name: "Drivers", href: "/drivers", Icon: Users },
    { name: "Vehicles", href: "/vehicles", Icon: Car },
    {
      name: "Technicians Assignment",
      href: "/callcenter/technician",
      Icon: Wrench,
    },
    { name: "Workshop Vehicles", href: "/callcenter/breakdowns", Icon: Truck },
    { name: "Repair Management", href: "/ccenter", Icon: Building2 },
    { name: "System Settings", href: "/settings", Icon: Settings },
  ],
  "cost centre": [
    { name: "Dashboard", href: "/dashboard", Icon: ChartBar },
    { name: "Cost", href: "/ccenter", Icon: Building2 },
    {
      name: "Repair Management",
      href: "/ccenter/create-qoutation",
      Icon: DollarSign,
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
      <div className="bg-gray-50 w-full">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden w-full"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: this is sticky/fixed and does NOT move */}
        <div
          className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        h-screen
      `}
        >
          {/* Header, nav, footer go here */}
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-black">
              <h1 className="text-xl font-bold text-white text-center">
                Maintanance
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                ✕
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                // const isActive = pathname.startsWith(item.href)
                const isActive = pathname === item.href;
                if (item.hasSubMenu) {
                  return (
                    <Collapsible
                      key={item.name}
                      defaultOpen={item.subMenu.some(
                        (subItem: { href: string }) =>
                          pathname.startsWith(subItem.href)
                      )}
                      className="list-none"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActive}>
                            <span>{item.name}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subMenu.map((subItem: SubMenuItem) => (
                            <SidebarMenuSubItem key={subItem.name}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname.startsWith(subItem.href)}
                              >
                                <Link href={subItem.href}>
                                  {subItem.icon && (
                                    <subItem.icon className="text-sidebar-foreground/60" />
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
                    className={`
                              flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                              ${
                                isActive
                                  ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.Icon className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t">
              <div className="mb-2 text-xs text-gray-500 text-center">
                Role:{" "}
                {userRole
                  ? userRole === "customer"
                    ? "External Workshop"
                    : userRole === "call centre"
                    ? "Workshop"
                    : userRole
                  : "No User"}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                🚪 Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content: this scrolls */}
        <div className="ml-64 h-screen overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white border-b text-white shadow-sm p-2">
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                ☰
              </Button>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-black">Welcome</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-6 w-full">
            <Card className="p-6">{children}</Card>
            <Toaster />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
