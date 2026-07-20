import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed'
import { TaskList } from '@/app/dashboard/tasks/TaskList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch metrics in parallel
  const now = new Date().toISOString()
  const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalWork },
    { count: completeWork },
    { count: delayWork },
    { count: nextDayWork },
    { data: profile },
    { data: initialLogs },
    { data: recentTasks }
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id).eq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id).eq('status', 'delayed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .neq('status', 'completed')
      .lte('deadline', next24Hours)
      .gte('deadline', now),
    supabase.from('profiles').select('total_points, full_name').eq('id', user.id).single(),
    supabase.from('performance_logs').select(`
      id,
      user_id,
      task_id,
      points_change,
      reason,
      created_at,
      profiles:user_id (full_name),
      tasks:task_id (title)
    `).order('created_at', { ascending: false }).limit(20),
    supabase.from('tasks')
      .select('*, assigned_to_profile:profiles!assigned_to(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(10) // Show a few recent tasks
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">
          Welcome back, {profile?.full_name || 'Team Member'}!
        </h1>
        <div className="ml-auto text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
          Total Points: {profile?.total_points || 0}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWork || 0}</div>
            <p className="text-xs text-muted-foreground">All tasks assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Complete Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completeWork || 0}</div>
            <p className="text-xs text-muted-foreground">Tasks marked as done</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Next Day Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextDayWork || 0}</div>
            <p className="text-xs text-muted-foreground">Due in the next 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Delay Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delayWork || 0}</div>
            <p className="text-xs text-muted-foreground">Tasks past their deadline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Recent Tasks</h2>
          <TaskList tasks={recentTasks || []} />
        </div>
        
        <div className="md:col-span-1 lg:col-span-2 h-[480px]">
          <LiveActivityFeed initialLogs={(initialLogs as any) || []} />
        </div>
      </div>
    </div>
  )
}
