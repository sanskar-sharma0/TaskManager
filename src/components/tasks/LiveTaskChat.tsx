'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { sendChatMessage } from '@/app/dashboard/tasks/actions'
import { SendIcon } from 'lucide-react'

type Comment = {
  id: string
  task_id: string
  user_id: string
  message: string
  created_at: string
  profiles?: {
    full_name: string
  }
}

export function LiveTaskChat({ 
  taskId, 
  initialComments,
  currentUserId
}: { 
  taskId: string
  initialComments: Comment[]
  currentUserId: string
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`task_comments_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        async (payload) => {
          // Fetch joined profile
          const { data } = await supabase
            .from('task_comments')
            .select('*, profiles:user_id(full_name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setComments((prev) => [...prev, data as Comment])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, taskId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    const msg = message
    setMessage('')
    await sendChatMessage(taskId, msg)
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-md">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Live Chat</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {comments.map(c => {
            const isMe = c.user_id === currentUserId
            const isSystem = c.message.startsWith('⏱️') || c.message.startsWith('✅') || c.message.startsWith('❌')
            
            if (isSystem) {
              return (
                <div key={c.id} className="flex justify-center my-2">
                  <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {c.message}
                  </span>
                </div>
              )
            }

            return (
              <div key={c.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <Avatar className="h-6 w-6 mb-1">
                    <AvatarFallback className="text-[10px]">
                      {c.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-muted-foreground ml-1 mb-1">{c.profiles?.full_name}</span>}
                  <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                    {c.message}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 mx-1">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )
          })}
          {comments.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground mt-10">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <Input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
