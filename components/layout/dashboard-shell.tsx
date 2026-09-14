import { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />

          <div className="h-5 w-px bg-border" />

          <div>
            <p className="text-sm font-medium">Daniel & Sarah</p>
            <p className="text-xs text-muted-foreground">Wedding Reception</p>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
