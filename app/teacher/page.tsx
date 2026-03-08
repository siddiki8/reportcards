"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GraduationCap, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"

export default function TeacherLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const pwDoc = await getDoc(doc(db, "settings", "teacherPassword"))
      if (!pwDoc.exists()) {
        setError("Teacher access has not been configured yet. Please contact the administrator.")
        setLoading(false)
        return
      }

      const storedPassword = pwDoc.data().password
      if (password === storedPassword) {
        sessionStorage.setItem("teacher_authenticated", "true")
        router.push("/teacher/grades")
      } else {
        setError("Incorrect password. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/" className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Teacher Portal
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground">
            Darul Islah Sunday School
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-card-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter teacher password"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enter
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Contact the school administrator for the password
          </p>
        </form>
      </div>
    </main>
  )
}
