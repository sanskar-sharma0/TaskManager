import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Team Directory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Members</CardTitle>
          <CardDescription>View and manage all members in your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name || 'No Name'}</TableCell>
                  <TableCell>{member.email || 'N/A'}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{member.total_points}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!teamMembers || teamMembers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
