"use client"

import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Loader2, Layers, AlertCircle } from "lucide-react"

interface Section {
  id: string
  name: string
  subjects: string[]
  order: number
}

interface MarkingPeriod {
  id: string
  name: string
  isActive: boolean
}

export default function TeacherGradesPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [activePeriod, setActivePeriod] = useState<MarkingPeriod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [sectionsSnap, periodsSnap] = await Promise.all([
          getDocs(
            query(collection(db, "sections"), orderBy("order", "asc"))
          ),
          getDocs(collection(db, "markingPeriods")),
        ])

        setSections(
          sectionsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Section[]
        )

        const active = periodsSnap.docs.find(
          (d) => d.data().isActive === true
        )
        if (active) {
          setActivePeriod({
            id: active.id,
            ...active.data(),
          } as MarkingPeriod)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Select a Section
        </h1>
        {activePeriod ? (
          <p className="text-muted-foreground">
            Entering grades for:{" "}
            <span className="font-medium text-primary">
              {activePeriod.name}
            </span>
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/20 px-3 py-2 text-sm text-accent-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            No active marking period. Please contact the administrator.
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            No sections available
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={
                activePeriod
                  ? `/teacher/grades/${section.id}`
                  : "#"
              }
              className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-colors ${
                activePeriod
                  ? "hover:border-primary/40 hover:bg-secondary"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!activePeriod) e.preventDefault()
              }}
            >
              <p className="text-lg font-semibold text-card-foreground">
                {section.name}
              </p>
              <div className="flex flex-wrap gap-1">
                {section.subjects.map((subj) => (
                  <span
                    key={subj}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
