"use client"

import { useState, useEffect, useCallback } from "react"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { NotesSection } from "@/components/sections/notes-section"
import { SharedSection } from "@/components/sections/shared-section"
import { MembersSection } from "@/components/sections/members-section"
import { SettingsSection } from "@/components/sections/settings-section"
import { Menu, X } from "lucide-react"

export default function WorkspacePage() {
  const [activeSection, setActiveSection] = useState("notes")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        if (!isInput) {
          e.preventDefault()
          const searchInput = document.querySelector<HTMLInputElement>(
            '[placeholder="Search notes..."]'
          )
          searchInput?.focus()
        }
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  function handleSectionChange(section: string) {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <WorkspaceSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <span className="ml-3 text-sm font-medium text-foreground capitalize">
            {activeSection}
          </span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {activeSection === "notes" && <NotesSection />}
          {activeSection === "shared" && <SharedSection />}
          {activeSection === "members" && <MembersSection />}
          {activeSection === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  )
}
