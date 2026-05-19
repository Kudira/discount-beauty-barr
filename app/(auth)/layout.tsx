import { Logo } from '@/components/shared/Logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FAF7F4 0%, #F2EDE8 60%, #E8DDD4 100%)' }}>
      {/* Header */}
      <div className="flex justify-center pt-10 pb-6">
        <Logo size="lg" />
      </div>
      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md bg-white border border-[#E8DDD4] p-8 sm:p-10" style={{ borderRadius: '2px' }}>
          {children}
        </div>
      </div>
      {/* Footer */}
      <div className="text-center pb-8">
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#8C7B74', textDecoration: 'none' }}>
          ← Back to store
        </Link>
      </div>
    </div>
  )
}
