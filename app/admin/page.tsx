"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import {
  Layers,
  Users,
  Calendar,
  MessageSquareText,
  FileText,
  Settings,
  ArrowRight,
} from "lucide-react"

interface DashboardStats {
  sections: number
  students: number
  markingPeriods: number
  activeMarkingPeriod: string
  commentCodes: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    sections: 0,
    students: 0,
    markingPeriods: 0,
    activeMarkingPeriod: "None",
    commentCodes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [sectionsSnap, studentsSnap, mpSnap, commentsSnap] =
          await Promise.all([
            getDocs(collection(db, "sections")),
            getDocs(collection(db, "students")),
            getDocs(collection(db, "markingPeriods")),
            getDocs(collection(db, "commentCodes")),
          ])

        const activeMp = mpSnap.docs.find(
          (doc) => doc.data().isActive === true
        )

        setStats({
          sections: sectionsSnap.size,
          students: studentsSnap.size,
          markingPeriods: mpSnap.size,
          activeMarkingPeriod: activeMp
            ? activeMp.data().name
            : "None set",
          commentCodes: commentsSnap.size,
        })
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      label: "Sections",
      value: stats.sections,
      icon: Layers,
      href: "/admin/sections",
      description: "Manage class sections and subjects",
    },
    {
      label: "Students",
      value: stats.students,
      icon: Users,
      href: "/admin/sections",
      description: "Across all sections",
    },
    {
      label: "Marking Periods",
      value: stats.markingPeriods,
      icon: Calendar,
      href: "/admin/marking-periods",
      description: `Active: ${stats.activeMarkingPeriod}`,
    },
    {
      label: "Comment Codes",
      value: stats.commentCodes,
      icon: MessageSquareText,
      href: "/admin/comments",
      description: "Manage comment codes",
    },
  ]

  const quickActions = [
    {
      label: "Generate Report Cards",
      icon: FileText,
      href: "/admin/reports",
      color: "bg-primary text-primary-foreground",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-secondary text-secondary-foreground",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your report card system
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <card.icon className="h-5 w-5 text-muted-foreground" />
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-2xl font-bold text-card-foreground">
                  {card.value}
                </p>
              )}
              <p className="text-sm font-medium text-card-foreground">
                {card.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 ${action.color}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
