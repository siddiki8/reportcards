"use client"

import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { pdf } from "@react-pdf/renderer"
import {
  ReportCardDocument,
  type ReportCardCommentCode,
  type ReportCardStudent,
} from "@/components/report-card-pdf"
import {
  FileText,
  Download,
  Loader2,
  ChevronDown,
  Users,
  BookOpen,
} from "lucide-react"

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

interface CommentCode {
  code: number
  text: string
}

interface StudentDoc {
  id: string
  name: string
  sectionId: string
}

interface GradeDoc {
  studentId: string
  subjectName: string
  grade: number | string | null
  commentCodes: number[]
}

export default function ReportsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [markingPeriods, setMarkingPeriods] = useState<MarkingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [selectedSection, setSelectedSection] = useState("all")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [schoolName, setSchoolName] = useState("Darul Islah Sunday School")

  useEffect(() => {
    async function fetchData() {
      try {
        const [sectionsSnap, periodsSnap, schoolDoc] = await Promise.all([
          getDocs(query(collection(db, "sections"), orderBy("order", "asc"))),
          getDocs(collection(db, "markingPeriods")),
          getDoc(doc(db, "settings", "school")),
        ])

        const secs = sectionsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Section[]
        setSections(secs)

        const periods = periodsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MarkingPeriod[]
        setMarkingPeriods(periods)

        // Default to the active period
        const active = periods.find((p) => p.isActive)
        if (active) setSelectedPeriod(active.id)
        else if (periods.length > 0) setSelectedPeriod(periods[0].id)

        if (schoolDoc.exists()) {
          const data = schoolDoc.data()
          if (data?.name) setSchoolName(data.name)
        }
      } catch (err) {
        console.error("Failed to load data:", err)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedPeriod) {
      toast.error("Please select a marking period")
      return
    }

    setGenerating(true)
    try {
      // Determine which sections to generate for
      const targetSections =
        selectedSection === "all"
          ? sections
          : sections.filter((s) => s.id === selectedSection)

      if (targetSections.length === 0) {
        toast.error("No sections selected")
        setGenerating(false)
        return
      }

      // Fetch comment codes
      const commentsSnap = await getDocs(
        query(collection(db, "commentCodes"), orderBy("code", "asc"))
      )
      const commentCodesMap: Record<number, string> = {}
      const commentCodesLegend: ReportCardCommentCode[] = commentsSnap.docs.map((d) => {
        const data = d.data() as CommentCode
        commentCodesMap[data.code] = data.text
        return { code: data.code, text: data.text }
      })

      // Fetch all students for target sections
      const allStudents: StudentDoc[] = []
      for (const sec of targetSections) {
        const studentsSnap = await getDocs(
          query(
            collection(db, "students"),
            where("sectionId", "==", sec.id),
            orderBy("name", "asc")
          )
        )
        studentsSnap.docs.forEach((d) => {
          allStudents.push({
            id: d.id,
            ...d.data(),
          } as StudentDoc)
        })
      }

      if (allStudents.length === 0) {
        toast.error("No students found for the selected section(s)")
        setGenerating(false)
        return
      }

      // Fetch all grades for this marking period + sections
      const allGrades: GradeDoc[] = []
      for (const sec of targetSections) {
        const gradesSnap = await getDocs(
          query(
            collection(db, "grades"),
            where("sectionId", "==", sec.id),
            where("markingPeriodId", "==", selectedPeriod)
          )
        )
        gradesSnap.docs.forEach((d) => {
          allGrades.push(d.data() as GradeDoc)
        })
      }

      // Build grade lookup: key = `${studentId}_${subjectName}`
      const gradeLookup: Record<
        string,
        { grade: number | string | null; commentCodes: number[] }
      > = {}
      allGrades.forEach((g) => {
        const key = `${g.studentId}_${g.subjectName}`
        gradeLookup[key] = {
          grade: g.grade,
          commentCodes: g.commentCodes ?? [],
        }
      })

      // Build report card data for each student
      const reportStudents: ReportCardStudent[] = allStudents.map(
        (student) => {
          const sec = targetSections.find(
            (s) => s.id === student.sectionId
          )!
          const subjects = sec.subjects.map((subj) => {
            const key = `${student.id}_${subj}`
            const gradeData = gradeLookup[key]
            return {
              name: subj,
              grade: gradeData?.grade ?? null,
              comments: (gradeData?.commentCodes ?? []).map(
                (code) => commentCodesMap[code] || `Code ${code}`
              ),
            }
          })

          return {
            id: student.id,
            name: student.name,
            sectionName: sec.name,
            subjects,
          }
        }
      )

      // Get the marking period name
      const mpName =
        markingPeriods.find((p) => p.id === selectedPeriod)?.name ?? ""

      // Generate PDF in the browser
      const blob = await pdf(
        <ReportCardDocument
          students={reportStudents}
          commentCodes={commentCodesLegend}
          markingPeriodName={mpName}
          schoolName={schoolName}
        />
      ).toBlob()

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const sectionLabel =
        selectedSection === "all"
          ? "All-Sections"
          : targetSections[0].name.replace(/\s+/g, "-")
      a.download = `Report-Cards_${mpName.replace(/\s+/g, "-")}_${sectionLabel}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(
        `Generated report cards for ${reportStudents.length} student(s)`
      )
    } catch (err) {
      console.error("Failed to generate report cards:", err)
      toast.error("Failed to generate report cards")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const selectedPeriodName = markingPeriods.find(
    (p) => p.id === selectedPeriod
  )?.name
  const selectedSectionName =
    selectedSection === "all"
      ? "All Sections"
      : sections.find((s) => s.id === selectedSection)?.name

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Report Cards
        </h1>
        <p className="text-muted-foreground">
          Generate and download student report cards as PDF
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5">
          {/* Marking Period Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">
              Marking Period
            </label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a marking period...</option>
                {markingPeriods.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.name} {mp.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Section Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">
              Section
            </label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Summary */}
          {selectedPeriod && (
            <div className="rounded-lg bg-secondary/50 px-4 py-3">
              <p className="text-sm text-secondary-foreground">
                <span className="font-medium">Will generate:</span>{" "}
                Report cards for{" "}
                <span className="font-semibold">{selectedSectionName}</span>{" "}
                in{" "}
                <span className="font-semibold">{selectedPeriodName}</span>
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedPeriod}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate & Download Report Cards
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {markingPeriods.length}
            </p>
            <p className="text-xs text-muted-foreground">Marking Periods</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {sections.length}
            </p>
            <p className="text-xs text-muted-foreground">Sections</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              PDFs are generated entirely in your browser. No server costs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
