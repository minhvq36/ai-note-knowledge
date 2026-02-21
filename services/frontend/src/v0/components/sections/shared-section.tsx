"use client"

import { useState } from "react"
import { NoteCard } from "@/components/note-card"
import { notes } from "@/lib/mock-data"
import { Share2 } from "lucide-react"

export function SharedSection() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const sharedNotes = notes.filter((n) => n.shared)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Shared with me</h2>
        <p className="text-xs text-muted-foreground">
          {sharedNotes.length} shared note{sharedNotes.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {sharedNotes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sharedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={activeNoteId === note.id}
                onClick={() => setActiveNoteId(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              No shared notes yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Notes shared by team members will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
