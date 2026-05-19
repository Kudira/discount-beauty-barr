import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginClient />
    </Suspense>
  )
}
