'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Medal } from 'lucide-react'
import { ActivityHistory } from '@/components/leaderboard/ActivityHistory'

export function LeaderboardClient({ profiles }: { profiles: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleRowClick = (user: any) => {
    setSelectedUser(user)
    setHistoryOpen(true)
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500" // Gold
    if (index === 1) return "text-gray-400"   // Silver
    if (index === 2) return "text-amber-600"  // Bronze
    return "text-transparent"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile, index) => (
                <TableRow 
                  key={profile.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(profile)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">{index + 1}</span>
                      {index < 3 && <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{profile.full_name?.substring(0, 2).toUpperCase() || 'TM'}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{profile.full_name || profile.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {profile.total_points}
                  </TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ActivityHistory 
        user={selectedUser} 
        open={historyOpen} 
        setOpen={setHistoryOpen} 
      />
    </>
  )
}
