import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <nav className="flex items-center gap-6 text-lg font-medium md:text-sm md:gap-5 lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <span>TaskManager</span>
          </Link>
          <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/dashboard/tasks" className="text-muted-foreground transition-colors hover:text-foreground">
            Tasks
          </Link>
          <Link href="/dashboard/leaderboard" className="text-muted-foreground transition-colors hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/dashboard/team" className="text-muted-foreground transition-colors hover:text-foreground">
            Team
          </Link>
          <Link href="/dashboard/settings" className="text-muted-foreground transition-colors hover:text-foreground">
            Settings
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <form action={signout}>
            <Button variant="outline" size="sm" type="submit">Sign Out</Button>
          </form>
        </div>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {children}
      </main>
    </div>
  )
}
