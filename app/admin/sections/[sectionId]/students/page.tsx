"use client"

import { useEffect, useRef, useState } from "react"
import { use } from "react"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ArrowLeft,
  UserPlus,
  Upload,
} from "lucide-react"

interface Student {
  id: string
  name: string
  sectionId: string
  order: number
}

interface SectionData {
  id: string
  name: string
}

export default function StudentsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const { sectionId } = use(params)
  const [students, setStudents] = useState<Student[]>([])
  const [section, setSection] = useState<SectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    try {
      const sectionDoc = await getDoc(doc(db, "sections", sectionId))
      if (sectionDoc.exists()) {
        setSection({ id: sectionDoc.id, name: sectionDoc.data().name })
      }

      const q = query(
        collection(db, "students"),
        where("sectionId", "==", sectionId),
        orderBy("name", "asc")
      )
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Student[]
      setStudents(data)
    } catch (err) {
      console.error("Failed to fetch students:", err)
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [sectionId])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setShowDialog(true)
  }

  const openEdit = (student: Student) => {
    setEditing(student)
    setName(student.name)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateDoc(doc(db, "students", editing.id), {
          name: name.trim(),
        })
        toast.success("Student updated")
      } else {
        await addDoc(collection(db, "students"), {
          name: name.trim(),
          sectionId,
          order: students.length,
        })
        toast.success("Student added")
      }
      setShowDialog(false)
      await fetchData()
    } catch (err) {
      console.error("Failed to save student:", err)
      toast.error("Failed to save student")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (student: Student) => {
    if (
      !confirm(
        `Delete "${student.name}"? This will not delete their grades.`
      )
    )
      return

    try {
      await deleteDoc(doc(db, "students", student.id))
      toast.success("Student deleted")
      await fetchData()
    } catch (err) {
      console.error("Failed to delete student:", err)
      toast.error("Failed to delete student")
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!csvInputRef.current) return
    csvInputRef.current.value = ""
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

      // Skip header row if it starts with "grade" (case-insensitive)
      const dataLines = lines[0]?.toLowerCase().startsWith("grade")
        ? lines.slice(1)
        : lines

      if (dataLines.length === 0) {
        toast.error("No student rows found in CSV")
        return
      }

      let imported = 0
      for (const line of dataLines) {
        // Support comma-separated with optional quotes
        const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim())
        // grade,firstname,lastname (3+ cols) or grade,name (2 cols)
        const studentName =
          parts.length >= 3
            ? `${parts[1]} ${parts[2]}`.trim()
            : parts[1] ?? ""
        if (!studentName) continue

        await addDoc(collection(db, "students"), {
          name: studentName,
          sectionId,
          order: students.length + imported,
        })
        imported++
      }

      toast.success(`Imported ${imported} student${imported !== 1 ? "s" : ""}`)
      await fetchData()
    } catch (err) {
      console.error("CSV import failed:", err)
      toast.error("Failed to import CSV")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sections"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {section?.name ?? "Section"} - Students
          </h1>
          <p className="text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </button>
        <button
          onClick={() => csvInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {importing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload CSV
        </button>
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleCsvUpload}
        />
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <UserPlus className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No students yet</p>
          <p className="text-sm text-muted-foreground">
            Add students to this section
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(student)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="Edit student"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                {editing ? "Edit Student" : "Add Student"}
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSave()
                    }
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter full name"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDialog(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Update" : "Add"} Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
