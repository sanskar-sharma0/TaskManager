'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_to = formData.get('assigned_to') as string
  const deadline = formData.get('deadline') as string

  if (!title || !assigned_to || !deadline) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase.from('tasks').insert({
    title,
    description,
    assigned_by: user.id,
    assigned_to,
    deadline: new Date(deadline).toISOString()
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markTaskDone(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Fetch the task to get its deadline
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (fetchError || !task) {
    return { error: 'Task not found' }
  }

  if (task.status === 'done') {
    return { error: 'Task is already done' }
  }

  const now = new Date()
  const deadline = new Date(task.deadline)
  let points_change = 4 // Base points for on-time completion
  
  if (now > deadline) {
    const delayMs = now.getTime() - deadline.getTime()
    const delayHours = Math.floor(delayMs / (1000 * 60 * 60))
    const delayDays = Math.floor(delayHours / 24)
    
    // Formula: -1 base penalty, -1 for every full 24 hours
    points_change = -1 - delayDays
  }

  // Insert performance log (which triggers profile total_points update)
  const { error: logError } = await supabase.from('performance_logs').insert({
    user_id: task.assigned_to,
    task_id: task.id,
    points_change,
    reason: points_change > 0 ? 'Completed on time' : 'Delayed completion penalty'
  })

  if (logError) {
    return { error: logError.message }
  }

  // Update task status
  const { error: updateError } = await supabase.from('tasks').update({
    status: 'done',
    completed_at: now.toISOString()
  }).eq('id', taskId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard')
  return { success: true, points_change }
}

export async function requestExtension(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update({ extension_requested: true, extension_status: 'pending' })
    .eq('id', taskId)

  if (error) return { error: error.message }

  // Auto drop a message
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    message: `⏱️ ${profile?.full_name || 'A user'} requested an extension.`,
  })

  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { success: true }
}

export async function approveExtension(taskId: string, newDeadline: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update({ extension_status: 'approved', extension_requested: false, deadline: new Date(newDeadline).toISOString() })
    .eq('id', taskId)
    .eq('assigned_by', user.id) // Only assigner can approve

  if (error) return { error: error.message }

  // Auto drop a message
  await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    message: `✅ Extension approved! New deadline set.`,
  })

  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { success: true }
}

export async function rejectExtension(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update({ extension_status: 'rejected', extension_requested: false })
    .eq('id', taskId)
    .eq('assigned_by', user.id)

  if (error) return { error: error.message }

  // Auto drop a message
  await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    message: `❌ Extension requested was rejected.`,
  })

  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { success: true }
}

export async function sendChatMessage(taskId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    message,
  })

  if (error) return { error: error.message }
  return { success: true }
}

