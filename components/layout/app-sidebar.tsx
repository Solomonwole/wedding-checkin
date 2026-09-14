"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  QrCode,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainNavigation = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Guests",
    href: "/admin/guests",
    icon: Users,
  },
  {
    title: "Invitations",
    href: "/admin/invitations",
    icon: Ticket,
  },
  {
    title: "Check-ins",
    href: "/admin/check-ins",
    icon: ClipboardCheck,
  },
];

const eventNavigation = [
  {
    title: "Scanner",
    href: "/scanner",
    icon: QrCode,
  },
  {
    title: "Event Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex h-16 items-center px-4">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <CalendarDays className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                Wedding Check-In
              </p>

              <p className="text-xs text-muted-foreground">Event management</p>
            </div>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      tooltip={item.title}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Event</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {eventNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      tooltip={item.title}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
              JD
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Event Admin</p>

              <p className="truncate text-xs text-muted-foreground">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
