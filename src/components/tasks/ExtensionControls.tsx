'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestExtension, approveExtension, rejectExtension } from '@/app/dashboard/tasks/actions'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export function ExtensionControls({
  taskId,
  status,
  requested,
  isAssignee,
  isAssigner,
  currentDeadline
}: {
  taskId: string
  status: string
  requested: boolean
  isAssignee: boolean
  isAssigner: boolean
  currentDeadline: string
}) {
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date(currentDeadline))
  const [open, setOpen] = useState(false)

  async function handleRequest() {
    setLoading(true)
    const res = await requestExtension(taskId)
    if (res?.error) toast.error(res.error)
    else toast.success('Extension requested successfully!')
    setLoading(false)
  }

  async function handleApprove() {
    if (!date) return
    setLoading(true)
    const res = await approveExtension(taskId, date.toISOString())
    if (res?.error) toast.error(res.error)
    else {
      toast.success('Extension approved!')
      setOpen(false)
    }
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    const res = await rejectExtension(taskId)
    if (res?.error) toast.error(res.error)
    else toast.success('Extension rejected.')
    setLoading(false)
  }

  if (status === 'approved') {
    return <div className="text-sm font-medium text-green-600">Extension Approved</div>
  }

  if (status === 'rejected') {
    return <div className="text-sm font-medium text-red-600">Extension Rejected</div>
  }

  if (status === 'pending') {
    if (isAssigner) {
      return (
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={<Button variant="default" size="sm" disabled={loading}>Approve Extension</Button>} />
            <PopoverContent className="w-auto p-4 flex flex-col gap-4">
              <h4 className="font-medium text-sm">Select New Deadline</h4>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                required
              />
              <Button size="sm" onClick={handleApprove} disabled={loading || !date}>
                Confirm Approval
              </Button>
            </PopoverContent>
          </Popover>
          <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>Reject</Button>
        </div>
      )
    }
    return <div className="text-sm font-medium text-yellow-600">Extension Pending...</div>
  }

  // status is 'none'
  if (isAssignee && !requested) {
    return (
      <Button variant="outline" size="sm" onClick={handleRequest} disabled={loading}>
        Request Extra Time
      </Button>
    )
  }

  return null
}
