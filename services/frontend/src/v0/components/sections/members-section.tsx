"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InviteMemberModal } from "@/components/invite-member-modal"
import { members } from "@/lib/mock-data"
import { Plus, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
}

export function MembersSection() {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Members</h2>
          <p className="text-xs text-muted-foreground">
            {members.length} members in this workspace
          </p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {member.name}
                  </span>
                  <Badge
                    variant={roleBadgeVariant[member.role]}
                    className="text-[10px] capitalize shrink-0"
                  >
                    {member.role}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.email}
                </span>
              </div>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                Joined {member.joinedAt}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Member actions</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Change role</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Remove member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <InviteMemberModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
