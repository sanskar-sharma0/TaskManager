'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markTaskInReview, approveTask, requestRevisions } from '@/app/dashboard/tasks/actions'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, PlayCircle } from 'lucide-react'

export function MakerCheckerControls({
  taskId,
  status,
  isAssignee,
  isAssigner
}: {
  taskId: string
  status: string
  isAssignee: boolean
  isAssigner: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleMarkInReview() {
    setLoading(true)
    const res = await markTaskInReview(taskId)
    if (res?.error) toast.error(res.error)
    else toast.success('Task submitted for review!')
    setLoading(false)
  }

  async function handleApprove() {
    setLoading(true)
    const res = await approveTask(taskId)
    if (res?.error) toast.error(res.error)
    else toast.success(`Task approved! ${res.points_change! > 0 ? '+' : ''}${res.points_change} points awarded`)
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    const res = await requestRevisions(taskId)
    if (res?.error) toast.error(res.error)
    else toast.success('Requested revisions.')
    setLoading(false)
  }

  return (
    <div className="flex gap-2 w-full mt-4 pt-4 border-t">
      {isAssignee && status !== 'completed' && status !== 'in_review' && (
        <Button 
          className="w-full flex items-center gap-2" 
          onClick={handleMarkInReview} 
          disabled={loading}
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Done
        </Button>
      )}

      {isAssigner && status === 'in_review' && (
        <div className="flex w-full gap-2">
          <Button 
            className="flex-1 flex items-center gap-2" 
            variant="default"
            onClick={handleApprove} 
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4" />
            Receive Work / Approve
          </Button>
          <Button 
            className="flex-1 flex items-center gap-2" 
            variant="destructive"
            onClick={handleReject} 
            disabled={loading}
          >
            <AlertCircle className="w-4 h-4" />
            Needs Revisions
          </Button>
        </div>
      )}
    </div>
  )
}
