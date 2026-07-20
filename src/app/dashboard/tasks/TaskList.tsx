'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { markTaskInReview } from './actions'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function TaskList({ tasks }: { tasks: any[] }) {
  
  async function handleMarkDone(taskId: string) {
    const res = await markTaskInReview(taskId)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Task submitted for review!')
    }
  }

  if (tasks.length === 0) {
    return <div className="text-center p-8 text-muted-foreground border rounded-lg">No tasks found.</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map(task => (
        <Card key={task.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                task.status === 'in_review' ? 'bg-purple-100 text-purple-700' :
                task.status === 'delayed' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Assigned to: <span className="font-medium text-foreground">{task.assigned_to_profile?.full_name || 'Unknown'}</span></div>
              <div className={new Date() > new Date(task.deadline) && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
                Deadline: {format(new Date(task.deadline), 'PP p')}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Link href={`/dashboard/tasks/${task.id}`} className="flex-1">
              <Button variant="outline" className="w-full">Details & Chat</Button>
            </Link>
            {task.status !== 'completed' && task.status !== 'in_review' ? (
              <Button onClick={() => handleMarkDone(task.id)} className="flex-1">
                Submit for Review
              </Button>
            ) : task.status === 'in_review' ? (
              <div className="flex-1 text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-md">
                In Review
              </div>
            ) : (
              <div className="flex-1 text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-md">
                Done on {task.completed_at ? format(new Date(task.completed_at), 'MMM d') : 'Unknown'}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
