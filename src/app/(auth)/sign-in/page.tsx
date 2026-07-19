'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '../actions'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignInPage() {
  async function handleSubmit(formData: FormData) {
    const res = await login(formData)
    if (res?.error) {
      toast.error(res.error)
    }
  }
  // Simple form handling for Phase 1
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" type="submit">Sign in</Button>
            <div className="text-sm text-center mt-2">
              Don't have an account? <Link href="/sign-up" className="underline">Sign up</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
