"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquareText,
  FileText,
  Settings,
  LogOut,
  Layers,
  Upload,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sections", label: "Sections", icon: Layers },
  { href: "/admin/students", label: "Import Students", icon: Upload },
  { href: "/admin/marking-periods", label: "Marking Periods", icon: Calendar },
  { href: "/admin/comments", label: "Comment Codes", icon: MessageSquareText },
  { href: "/admin/reports", label: "Report Cards", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/admin/login")
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">
            Darul Islah
          </span>
          <span className="text-xs text-sidebar-foreground/60">
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function AdminMobileHeader() {
  const pathname = usePathname()
  const currentPage = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )

  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
      <Link href="/admin" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {currentPage?.label ?? "Admin"}
        </span>
      </Link>
    </div>
  )
}

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card px-1 py-2 lg:hidden">
      {navItems.slice(0, 5).map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only lg:not-sr-only">{item.label}</span>
          </Link>
        )
      })}
      <Link
        href="/admin/settings"
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs transition-colors",
          pathname.startsWith("/admin/settings")
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Settings className="h-5 w-5" />
        <span className="sr-only lg:not-sr-only">Settings</span>
      </Link>
    </nav>
  )
}
