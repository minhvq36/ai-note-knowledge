"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface CreateNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNoteModal({ open, onOpenChange }: CreateNoteModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isShared, setIsShared] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    toast.success(`Note "${title}" created`)
    setTitle("")
    setContent("")
    setIsShared(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create note</DialogTitle>
          <DialogDescription>
            Start a new note in this workspace
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              placeholder="Enter a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 resize-none"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="note-shared" className="text-sm font-medium cursor-pointer">
                Share with team
              </Label>
              <span className="text-xs text-muted-foreground">
                Make this note visible to all workspace members
              </span>
            </div>
            <Switch
              id="note-shared"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90">
              Create note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
