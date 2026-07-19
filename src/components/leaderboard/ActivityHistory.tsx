'use client'

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserActivityLogs } from "@/app/dashboard/leaderboard/actions"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function ActivityHistory({ 
  user, 
  open, 
  setOpen 
}: { 
  user: { id: string; full_name: string } | null, 
  open: boolean, 
  setOpen: (open: boolean) => void 
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [logs, setLogs] = React.useState<Record<string, any>[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open && user) {
      const fetchLogs = async () => {
        setLoading(true)
        const data = await getUserActivityLogs(user.id)
        setLogs(data)
        setLoading(false)
      }
      fetchLogs()
    }
  }, [open, user])

  const Content = (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      {loading ? (
        <div className="flex justify-center items-center h-full text-muted-foreground">Loading history...</div>
      ) : logs.length === 0 ? (
        <div className="flex justify-center items-center h-full text-muted-foreground">No activity logs found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{(log.tasks as { title: string })?.title || "Unknown Task"}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at as string), "PPp")}</span>
                <span className="text-xs">{log.reason as string}</span>
              </div>
              <Badge variant={(log.points_change as number) > 0 ? "default" : "destructive"} className={(log.points_change as number) > 0 ? "bg-green-600 hover:bg-green-700" : ""}>
                {(log.points_change as number) > 0 ? '+' : ''}{log.points_change as number} pts
              </Badge>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{user?.full_name}&apos;s Activity History</DialogTitle>
            <DialogDescription>
              Detailed breakdown of past tasks and point changes.
            </DialogDescription>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{user?.full_name}&apos;s Activity History</DrawerTitle>
          <DrawerDescription>
            Detailed breakdown of past tasks and point changes.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {Content}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose render={<Button variant="outline">Close</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
