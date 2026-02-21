"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function SettingsSection() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground">
          Manage your workspace preferences
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-lg px-6 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground">General</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="workspace-name" className="text-sm">
                  Workspace name
                </Label>
                <Input
                  id="workspace-name"
                  defaultValue="Acme Corp"
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="workspace-slug" className="text-sm">
                  Workspace slug
                </Label>
                <Input
                  id="workspace-slug"
                  defaultValue="acme-corp"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <Button
                size="sm"
                className="w-fit bg-foreground text-background hover:bg-foreground/90"
                onClick={() => toast.success("Settings saved")}
              >
                Save changes
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground">API Access</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="api-key" className="text-sm">
                  API Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="api-key"
                    defaultValue="nsk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="h-9 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText("nsk_live_xxxxxxxxxxxxxxxxxxxxxxxx")
                      toast.success("API key copied to clipboard")
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key to authenticate API requests
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground">
                Permanently delete this workspace and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" size="sm" className="w-fit">
                Delete workspace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
