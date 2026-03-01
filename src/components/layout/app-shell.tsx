"use client";

import type { ReactNode } from "react";
import { Sidebar, MobileBottomNav } from "./sidebar";
import { Header } from "./header";
import { PaymentTicker } from "./payment-ticker";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <PaymentTicker />
        <main className="flex-1 overflow-y-auto p-6 max-md:p-4 max-md:pb-20">
          <div className="mx-auto max-w-content">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export { AppShell, type AppShellProps };
