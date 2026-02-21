"use client"

import { useState } from "react"
import { ChevronsUpDown, Check, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { tenants } from "@/lib/mock-data"

export function TenantSwitcher() {
  const [selected, setSelected] = useState(tenants[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary transition-colors outline-none">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
            {selected.name.charAt(0)}
          </span>
          <span className="truncate font-medium text-foreground">
            {selected.name}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => setSelected(tenant)}
            className="flex items-center gap-2"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[9px] font-bold text-accent-foreground">
              {tenant.name.charAt(0)}
            </span>
            <span className="flex-1 truncate">{tenant.name}</span>
            {selected.id === tenant.id && (
              <Check className="h-3.5 w-3.5 text-accent" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          <span>Create tenant</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
