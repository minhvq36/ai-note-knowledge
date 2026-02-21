"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NoteCard } from "@/components/note-card"
import { CreateNoteModal } from "@/components/create-note-modal"
import { notes } from "@/lib/mock-data"
import { Plus, Search, SlidersHorizontal } from "lucide-react"

export function NotesSection() {
  const [search, setSearch] = useState("")
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))

  const filtered = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.preview.toLowerCase().includes(search.toLowerCase())
    const matchesTag = activeFilter ? note.tags.includes(activeFilter) : true
    return matchesSearch && matchesTag
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} note{filtered.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          New note
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-6 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 shrink-0">
          <SlidersHorizontal className="mr-1 h-3 w-3" />
          Filter
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-6 py-2.5">
        <button
          onClick={() => setActiveFilter(null)}
          className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
            activeFilter === null
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
            className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
              activeFilter === tag
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-2">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isActive={activeNoteId === note.id}
              onClick={() => setActiveNoteId(note.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No notes found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateNoteModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
