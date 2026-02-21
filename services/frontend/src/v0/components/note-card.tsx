"use client"

import { cn } from "@/lib/utils"
import { Pin, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Note } from "@/lib/mock-data"

interface NoteCardProps {
  note: Note
  isActive?: boolean
  onClick?: () => void
}

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-all",
        isActive
          ? "border-accent bg-accent/10"
          : "border-border bg-card hover:border-border hover:bg-secondary/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-card-foreground leading-snug">
          {note.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {note.pinned && (
            <Pin className="h-3 w-3 text-accent" />
          )}
          {note.shared && (
            <Share2 className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
        {note.preview}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
            {note.authorAvatar}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {note.author}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {note.updatedAt}
        </span>
      </div>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}
