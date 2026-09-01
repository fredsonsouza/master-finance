import { auth } from '@/auth/auth'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await auth()

  if (user.forcePasswordChange) {
    redirect('/auth/change-password')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
