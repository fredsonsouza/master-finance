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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
