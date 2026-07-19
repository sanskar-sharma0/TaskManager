'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserActivityLogs(userId: string) {
  const supabase = await createClient()
  
  const { data: logs, error } = await supabase
    .from('performance_logs')
    .select(`
      id,
      points_change,
      reason,
      created_at,
      task_id,
      tasks!inner(title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  return logs
}
