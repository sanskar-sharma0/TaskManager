import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, total_points')
    .order('total_points', { ascending: false })

  if (error) {
    console.error('Error fetching leaderboard:', error)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Leaderboard</h1>
      </div>
      
      <LeaderboardClient profiles={profiles || []} />
    </div>
  )
}
