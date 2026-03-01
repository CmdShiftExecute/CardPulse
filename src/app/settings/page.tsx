"use client";

import { useState } from "react";
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
} from "lucide-react";
import { GeneralSettings } from "@/components/settings/general-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { CardsSettings } from "@/components/settings/cards-settings";
import { KeywordRulesManager } from "@/components/settings/keyword-rules-manager";
import { LabelsManager } from "@/components/settings/labels-manager";
import { CategoriesManager } from "@/components/settings/categories-manager";
import { DataManagement } from "@/components/settings/data-management";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  const sections: Section[] = [
    { id: "general", label: "General", icon: SettingsIcon, component: <GeneralSettings /> },
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
