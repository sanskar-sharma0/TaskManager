'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProfile } from './actions'
import { toast } from 'sonner'

export function ProfileForm({ initialName }: { initialName: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const res = await updateProfile(formData)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Profile updated successfully!')
    }
    setLoading(false)
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name" 
              name="full_name" 
              defaultValue={initialName} 
              placeholder="E.g. John Doe"
              required 
            />
          </div>
          <Button type="submit" className="w-fit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
