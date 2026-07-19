'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type ActivityLog = {
  id: string
  user_id: string
  task_id: string
  points_change: number
  reason: string
  created_at: string
  profiles?: {
    full_name: string
  }
  tasks?: {
    title: string
  }
}

export function LiveActivityFeed({ initialLogs }: { initialLogs: ActivityLog[] }) {
  const [logs, setLogs] = React.useState<ActivityLog[]>(initialLogs)
  const supabase = createClient()

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime_performance_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_logs',
        },
        async (payload) => {
          // Fetch the joined data for the new log
          const { data, error } = await supabase
            .from('performance_logs')
            .select(`
              id,
              user_id,
              task_id,
              points_change,
              reason,
              created_at,
              profiles:user_id (full_name),
              tasks:task_id (title)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data && !error) {
            setLogs((current) => [data as any, ...current].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Activity Feed
        </CardTitle>
        <CardDescription>Real-time updates from the team</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[400px] w-full px-6 pb-6">
          <div className="flex flex-col gap-4">
            {logs.map((log) => {
              const isPositive = log.points_change > 0
              const userName = log.profiles?.full_name || 'A team member'
              const taskTitle = log.tasks?.title || 'a task'

              return (
                <div 
                  key={log.id} 
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-all hover:bg-muted/50 ${
                    isPositive ? 'border-green-100 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10' : 'border-red-100 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'
                  }`}
                >
                  <Avatar className="mt-0.5 h-8 w-8">
                    <AvatarFallback className={isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}>
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-none">
                        {isPositive ? (
                          <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {userName} completed '{taskTitle}' on time
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            {userName} delayed '{taskTitle}'
                          </span>
                        )}
                      </p>
                      <span className={`shrink-0 font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}{log.points_change} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{log.reason}</p>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {logs.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No recent activity.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
