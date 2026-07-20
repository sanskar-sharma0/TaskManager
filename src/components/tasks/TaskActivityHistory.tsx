import { format } from 'date-fns'
import { Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TaskActivityHistory({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return null
  }

  function renderLogMessage(log: any) {
    const userName = log.profiles?.full_name || 'System'
    
    if (log.action_type === 'created') {
      return `${userName} created the task`
    }
    
    if (log.action_type === 'updated') {
      const oldVal = log.old_value || {}
      const newVal = log.new_value || {}
      
      const changes = []
      if (oldVal.status !== newVal.status) {
        changes.push(`status from ${oldVal.status?.toUpperCase() || 'none'} to ${newVal.status?.toUpperCase() || 'none'}`)
      }
      if (oldVal.deadline !== newVal.deadline) {
        changes.push(`deadline updated`)
      }
      if (oldVal.assigned_to !== newVal.assigned_to) {
        changes.push(`reassigned`)
      }
      
      if (changes.length > 0) {
        return `${userName} updated ${changes.join(', ')}`
      }
      return `${userName} updated the task`
    }

    return `${userName} performed ${log.action_type}`
  }

  return (
    <Card className="mt-6">
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="relative border-l border-muted ml-3 pl-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="relative">
              <span className="absolute -left-6 top-1 bg-background p-0.5 rounded-full border">
                <Clock className="w-3 h-3 text-muted-foreground" />
              </span>
              <div className="text-sm text-foreground">
                {renderLogMessage(log)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
