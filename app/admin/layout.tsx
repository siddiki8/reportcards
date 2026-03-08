"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AdminSidebar, AdminMobileHeader, AdminMobileNav } from "@/components/admin-sidebar"

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/admin/login")
    }
  }, [user, loading, router, isLoginPage])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminMobileHeader />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-8 lg:pb-8">
          {children}
        </main>
        <AdminMobileNav />
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AuthProvider>
  )
}
