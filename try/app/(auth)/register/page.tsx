import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterClient } from './RegisterClient'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <Suspense fallback={<div />}>
      <RegisterClient />
    </Suspense>
  )
}
