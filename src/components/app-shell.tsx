"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  DollarSign,
  CreditCard,
  Calendar,
  Lightbulb,
  FileText,
  Package,
  Users,
  CircleUser,
  Kanban,
  Contact,
} from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Contact },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/kanban", label: "Kanban", icon: Kanban },
];

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (!isClient) {
    return (
        <div className="flex min-h-svh w-full">
            <div className="hidden md:flex flex-col w-64 border-r p-2 gap-2">
                 <div className="flex items-center gap-2 h-[52px] p-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-6 w-24" />
                 </div>
                 <div className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => (
                        <Skeleton key={item.href} className="h-8 w-full" />
                    ))}
                 </div>
            </div>
            <div className="flex-1">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </header>
                <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6">{children}</main>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarHeader>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link href="/">
                    <FileText className="h-5 w-5" />
                </Link>
               </Button>
              <h1 className="text-xl font-semibold group-[[data-state=collapsed]]:hidden">BizSight</h1>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger />
          <div className="flex-1">
            {/* Can add page-specific header content here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
