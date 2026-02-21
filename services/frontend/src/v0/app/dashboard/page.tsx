"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Layers,
  Plus,
  Users,
  FileText,
  ArrowRight,
  LogOut,
} from "lucide-react"
import { tenants } from "@/lib/mock-data"
import { toast } from "sonner"

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
}

export default function DashboardPage() {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [tenantName, setTenantName] = useState("")

  function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault()
    toast.success(`Tenant "${tenantName}" created`)
    setTenantName("")
    setCreateOpen(false)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Layers className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-semibold text-foreground">NoteStack</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Workspaces
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a workspace or create a new one to get started
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New workspace
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="group cursor-pointer border-border bg-card transition-all hover:border-accent/50 hover:shadow-md hover:shadow-accent/5"
              onClick={() => router.push(`/workspace/${tenant.slug}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-card-foreground">
                        {tenant.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tenant.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={roleBadgeVariant[tenant.role]} className="text-[10px] capitalize">
                    {tenant.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tenant.memberCount} members
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {tenant.noteCount} notes
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Created {tenant.createdAt}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace for your team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTenant} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tenant-name">Workspace name</Label>
              <Input
                id="tenant-name"
                placeholder="My Team"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90">
                Create workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
