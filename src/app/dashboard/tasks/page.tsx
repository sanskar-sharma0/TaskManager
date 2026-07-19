import { createClient } from '@/lib/supabase/server'
import { TaskList } from './TaskList'
import { TaskCreateForm } from './TaskCreateForm'
import { redirect } from 'next/navigation'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch all tasks for the org/team
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assigned_to_profile:profiles!assigned_to(full_name, email)')
    .order('created_at', { ascending: false })

  // Fetch all profiles for the assignment dropdown
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Tasks</h1>
        <TaskCreateForm users={profiles || []} />
      </div>
      
      <TaskList tasks={tasks || []} />
    </div>
  )
}
