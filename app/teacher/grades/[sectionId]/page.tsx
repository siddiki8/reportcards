"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { use } from "react"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  setDoc,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Loader2, Check, Save } from "lucide-react"
import { CommentCodePicker } from "@/components/comment-code-picker"

interface Student {
  id: string
  name: string
  order: number
}

interface SectionData {
  id: string
  name: string
  subjects: string[]
}

interface MarkingPeriod {
  id: string
  name: string
}

interface GradeData {
  grade: number | string | null
  commentCodes: number[]
}

interface CommentCode {
  id: string
  code: number
  text: string
}

// key = `${studentId}_${subjectName}`
type GradeMap = Record<string, GradeData>

export default function GradeEntryPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const { sectionId } = use(params)
  const [section, setSection] = useState<SectionData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [activePeriod, setActivePeriod] = useState<MarkingPeriod | null>(null)
  const [grades, setGrades] = useState<GradeMap>({})
  const [commentCodes, setCommentCodes] = useState<CommentCode[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set())
  const [savedCells, setSavedCells] = useState<Set<string>>(new Set())
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch section info
        const sectionDoc = await getDoc(doc(db, "sections", sectionId))
        if (!sectionDoc.exists()) {
          toast.error("Section not found")
          return
        }
        const sectionData = {
          id: sectionDoc.id,
          ...sectionDoc.data(),
        } as SectionData
        setSection(sectionData)

        // Fetch all data in parallel
        const [studentsSnap, periodsSnap, commentsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "students"),
              where("sectionId", "==", sectionId),
              orderBy("name", "asc")
            )
          ),
          getDocs(collection(db, "markingPeriods")),
          getDocs(
            query(collection(db, "commentCodes"), orderBy("code", "asc"))
          ),
        ])

        const studentsList = studentsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Student[]
        setStudents(studentsList)

        setCommentCodes(
          commentsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as CommentCode[]
        )

        const active = periodsSnap.docs.find(
          (d) => d.data().isActive === true
        )
        if (!active) {
          toast.error("No active marking period found")
          setLoading(false)
          return
        }
        const mp = { id: active.id, ...active.data() } as MarkingPeriod
        setActivePeriod(mp)

        // Fetch existing grades
        const gradesSnap = await getDocs(
          query(
            collection(db, "grades"),
            where("sectionId", "==", sectionId),
            where("markingPeriodId", "==", mp.id)
          )
        )

        const gradeMap: GradeMap = {}
        gradesSnap.docs.forEach((d) => {
          const data = d.data()
          const key = `${data.studentId}_${data.subjectName}`
          gradeMap[key] = {
            grade: data.grade ?? null,
            commentCodes: data.commentCodes ?? [],
          }
        })
        setGrades(gradeMap)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        toast.error("Failed to load grade data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout)
    }
  }, [sectionId])

  const saveGrade = useCallback(
    async (
      studentId: string,
      subjectName: string,
      gradeData: GradeData
    ) => {
      if (!activePeriod) return
      const key = `${studentId}_${subjectName}`
      const docId = `${activePeriod.id}_${studentId}_${subjectName}`

      setSavingCells((prev) => new Set(prev).add(key))
      setSavedCells((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })

      try {
        await setDoc(doc(db, "grades", docId), {
          studentId,
          subjectName,
          sectionId,
          markingPeriodId: activePeriod.id,
          grade: gradeData.grade,
          commentCodes: gradeData.commentCodes,
        })

        setSavedCells((prev) => new Set(prev).add(key))
        setTimeout(() => {
          setSavedCells((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        }, 2000)
      } catch (err) {
        console.error("Failed to save grade:", err)
        toast.error("Failed to save grade")
      } finally {
        setSavingCells((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [activePeriod, sectionId]
  )

  const handleGradeChange = useCallback(
    (studentId: string, subjectName: string, value: string) => {
      const key = `${studentId}_${subjectName}`
      
      // Handle "INC" as a special string value
      let gradeValue: number | string | null = null
      if (value === "" || value === null) {
        gradeValue = null
      } else if (value.toUpperCase() === "INC") {
        gradeValue = "INC"
      } else {
        const numValue = parseInt(value, 10)
        if (!isNaN(numValue)) {
          gradeValue = Math.min(100, Math.max(0, numValue))
        }
      }

      setGrades((prev) => ({
        ...prev,
        [key]: {
          grade: gradeValue,
          commentCodes: prev[key]?.commentCodes ?? [],
        },
      }))

      if (saveTimers.current[key]) {
        clearTimeout(saveTimers.current[key])
      }

      saveTimers.current[key] = setTimeout(() => {
        const gradeData = {
          grade: gradeValue,
          commentCodes: grades[key]?.commentCodes ?? [],
        }
        saveGrade(studentId, subjectName, gradeData)
      }, 800)
    },
    [grades, saveGrade]
  )

  const handleCommentCodesChange = useCallback(
    (studentId: string, subjectName: string, codes: number[]) => {
      const key = `${studentId}_${subjectName}`

      setGrades((prev) => {
        const updated = {
          ...prev,
          [key]: {
            grade: prev[key]?.grade ?? null,
            commentCodes: codes,
          },
        }

        // Save immediately for comment codes
        saveGrade(studentId, subjectName, updated[key])

        return updated
      })
    },
    [saveGrade]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!section || !activePeriod) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <p className="text-muted-foreground">
          {!section
            ? "Section not found"
            : "No active marking period"}
        </p>
        <Link
          href="/teacher/grades"
          className="text-sm text-primary hover:underline"
        >
          Go back
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/grades"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {section.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activePeriod.name} &middot; {students.length} students &middot;{" "}
            {section.subjects.length} subjects
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground font-medium">
            No students in this section
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="sticky left-0 z-10 bg-secondary/50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[160px]">
                  Student
                </th>
                {section.subjects.map((subj) => (
                  <th
                    key={subj}
                    className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[120px]"
                  >
                    {subj}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 text-sm font-medium text-card-foreground border-r border-border">
                    {student.name}
                  </td>
                  {section.subjects.map((subj) => {
                    const key = `${student.id}_${subj}`
                    const gradeData = grades[key]
                    const isSaving = savingCells.has(key)
                    const isSaved = savedCells.has(key)

                    return (
                      <td
                        key={subj}
                        className="px-2 py-2 text-center"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <input
                              type="text"
                              value={
                                gradeData?.grade !== null &&
                                gradeData?.grade !== undefined
                                  ? gradeData.grade
                                  : ""
                              }
                              onChange={(e) =>
                                handleGradeChange(
                                  student.id,
                                  subj,
                                  e.target.value
                                )
                              }
                              className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                              placeholder="--"
                              title="Enter 0-100 or INC"
                            />
                            {isSaving && (
                              <div className="absolute -right-5 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              </div>
                            )}
                            {isSaved && (
                              <div className="absolute -right-5 top-1/2 -translate-y-1/2">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            )}
                          </div>
                          <CommentCodePicker
                            allCodes={commentCodes}
                            selectedCodes={
                              gradeData?.commentCodes ?? []
                            }
                            onChange={(codes) =>
                              handleCommentCodesChange(
                                student.id,
                                subj,
                                codes
                              )
                            }
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Grades auto-save as you type. Enter values 0-100 or type "INC" for incomplete.
      </p>
    </div>
  )
}
