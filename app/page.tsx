import Link from "next/link"
import { BookOpen, GraduationCap, ShieldCheck } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            Darul Islah Sunday School
          </h1>
          <p className="text-pretty text-muted-foreground">
            Report Card Management System
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <Link
            href="/teacher"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-card-foreground">
                Teacher Portal
              </p>
              <p className="text-sm text-muted-foreground">
                Enter grades and comment codes for students
              </p>
            </div>
          </Link>

          <Link
            href="/admin/login"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-card-foreground">
                Admin Dashboard
              </p>
              <p className="text-sm text-muted-foreground">
                Manage sections, students, marking periods, and reports
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
