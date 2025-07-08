"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link href="/">
                    <FileText className="h-5 w-5" />
                </Link>
               </Button>
              <h1 className="text-xl font-semibold">BizSight</h1>
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
          <SidebarTrigger className="md:hidden" />
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
