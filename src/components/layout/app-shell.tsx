"use client";

import type { ReactNode } from "react";
import { Sidebar, MobileBottomNav } from "./sidebar";
import { Header } from "./header";
import { PaymentTicker } from "./payment-ticker";
import { CardPulseLogo } from "@/components/ui/cardpulse-logo";

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
        <main className="relative flex-1 overflow-y-auto p-6 max-md:p-4 max-md:pb-20">
          {/* Background silhouette — pulse-only mark at very low opacity.
              Scoped to <main> so it never bleeds onto the sidebar.
              `pointer-events-none` keeps it from blocking any interaction. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden select-none"
          >
            <CardPulseLogo
              filled={false}
              size={900}
              className="absolute -right-32 -bottom-32 text-sage-400 opacity-[0.04]"
            />
          </div>

          <div className="relative mx-auto max-w-content">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export { AppShell, type AppShellProps };
