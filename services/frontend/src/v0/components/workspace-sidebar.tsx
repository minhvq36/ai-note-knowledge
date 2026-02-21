"use client"

import { cn } from "@/lib/utils"
import {
  FileText,
  Users,
  Share2,
  Settings,
  Layers,
  Search,
  Plus,
} from "lucide-react"
import { TenantSwitcher } from "@/components/tenant-switcher"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface WorkspaceSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const navItems = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "shared", label: "Shared with me", icon: Share2 },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

export function WorkspaceSidebar({
  activeSection,
  onSectionChange,
}: WorkspaceSidebarProps) {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-border px-3">
        <TenantSwitcher />
      </div>

      <div className="px-3 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md bg-secondary px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-3.5 w-3.5" />
              <span>Search notes...</span>
              <kbd className="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                /
              </kbd>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Search all notes</TooltipContent>
        </Tooltip>
      </div>

      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <Plus className="h-4 w-4" />
          New note
        </button>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            SC
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-foreground">Sarah Chen</span>
            <span className="text-[10px] text-muted-foreground">sarah@acme.dev</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
