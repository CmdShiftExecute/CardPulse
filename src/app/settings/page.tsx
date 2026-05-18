"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings as SettingsIcon,
  Palette,
  Shield,
  CreditCard,
  BookKey,
  Tags,
  FolderTree,
  Database,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { GeneralSettings } from "@/components/settings/general-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { CardsSettings } from "@/components/settings/cards-settings";
import { KeywordRulesManager } from "@/components/settings/keyword-rules-manager";
import { LabelsManager } from "@/components/settings/labels-manager";
import { CategoriesManager } from "@/components/settings/categories-manager";
import { DataManagement } from "@/components/settings/data-management";
import { FixedCostsSettings } from "@/components/settings/fixed-costs-settings";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section") || "general";
  const [activeSection, setActiveSection] = useState(initialSection);

  // Update if query param changes (e.g. navigating from Survival summary link)
  useEffect(() => {
    const s = searchParams.get("section");
    if (s) setActiveSection(s);
  }, [searchParams]);

  /**
   * Back button: prefer browser history if we have any (so we land on whichever
   * page brought the user here). Fall back to /dashboard if Settings was opened
   * as the first page in the tab (e.g. typed URL or deep link in fresh window).
   */
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  const sections: Section[] = [
    { id: "general", label: "General", icon: SettingsIcon, component: <GeneralSettings /> },
    { id: "fixed-costs", label: "Fixed Costs", icon: Wallet, component: <FixedCostsSettings /> },
    { id: "appearance", label: "Appearance", icon: Palette, component: <AppearanceSettings /> },
    { id: "security", label: "Security", icon: Shield, component: <SecuritySettings /> },
    { id: "cards", label: "Cards", icon: CreditCard, component: <CardsSettings /> },
    { id: "keywords", label: "Keywords", icon: BookKey, component: <KeywordRulesManager /> },
    { id: "labels", label: "Labels", icon: Tags, component: <LabelsManager /> },
    { id: "categories", label: "Categories", icon: FolderTree, component: <CategoriesManager /> },
    { id: "data", label: "Data", icon: Database, component: <DataManagement /> },
  ];

  const active = sections.find((s) => s.id === activeSection) ?? sections[0];

  return (
    <div className="space-y-6">
      {/* Back button — returns to the previous page if we have history,
          otherwise falls back to dashboard. */}
      <button
        onClick={handleBack}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 -ml-2.5",
          "text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2",
          "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sage-glow"
        )}
        aria-label="Go back to previous page"
      >
        <ArrowLeft size={15} />
        <span>Back</span>
      </button>

      {/* Section pills - horizontal scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-button px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-sage-400 text-text-on-accent"
                  : "bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-border"
              )}
            >
              <Icon size={16} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active section content */}
      <div className="rounded-card border border-border bg-surface-1 p-6">
        {active.component}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-32 rounded-card bg-surface-1 border border-border animate-pulse" />}>
      <SettingsPageInner />
    </Suspense>
  );
}
