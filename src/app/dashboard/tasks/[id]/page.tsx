import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { LiveTaskChat } from '@/components/tasks/LiveTaskChat'
import { ExtensionControls } from '@/components/tasks/ExtensionControls'
import { MakerCheckerControls } from '@/components/tasks/MakerCheckerControls'
import { TaskActivityHistory } from '@/components/tasks/TaskActivityHistory'

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch task and related data
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, assigned_by_profile:profiles!assigned_by(full_name), assigned_to_profile:profiles!assigned_to(full_name)')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    notFound()
  }

  // Fetch initial comments
  const { data: initialComments } = await supabase
    .from('task_comments')
    .select('*, profiles:user_id(full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  // Fetch activity logs
  const { data: activityLogs } = await supabase
    .from('task_activity_logs')
    .select('*, profiles:user_id(full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  const isAssignee = task.assigned_to === user.id
  const isAssigner = task.assigned_by === user.id

  const isDelayed = new Date() > new Date(task.deadline) && task.status !== 'completed'

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Task Details</h1>
        <Badge variant={task.status === 'completed' ? 'default' : isDelayed ? 'destructive' : task.status === 'in_review' ? 'default' : 'secondary'}>
          {task.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Details */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>Created on {format(new Date(task.created_at), 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{task.description || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Assigned By</h4>
                  <p className="text-sm font-medium">{task.assigned_by_profile?.full_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Assigned To</h4>
                  <p className="text-sm font-medium">{task.assigned_to_profile?.full_name}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Deadline</h4>
                <p className={`text-sm font-medium ${isDelayed ? 'text-destructive' : ''}`}>
                  {format(new Date(task.deadline), 'PPP')} {isDelayed && '(Overdue)'}
                </p>
              </div>

              <MakerCheckerControls
                taskId={task.id}
                status={task.status}
                isAssignee={isAssignee}
                isAssigner={isAssigner}
              />

              {task.status !== 'completed' && (
                <div className="pt-4 border-t mt-2 flex justify-between items-center">
                  <h4 className="font-medium text-sm">Time Extension</h4>
                  <ExtensionControls 
                    taskId={task.id}
                    status={task.extension_status}
                    requested={task.extension_requested}
                    isAssignee={isAssignee}
                    isAssigner={isAssigner}
                    currentDeadline={task.deadline}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <TaskActivityHistory logs={activityLogs || []} />
        </div>

        {/* Right Column: Live Chat */}
        <div>
          <LiveTaskChat 
            taskId={task.id}
            initialComments={(initialComments as any) || []}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
