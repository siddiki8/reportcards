"use client"

import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  BookOpen,
} from "lucide-react"

interface Section {
  id: string
  name: string
  subjects: string[]
  order: number
}

interface StudentCount {
  [sectionId: string]: number
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [studentCounts, setStudentCounts] = useState<StudentCount>({})
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [name, setName] = useState("")
  const [subjects, setSubjects] = useState<string[]>([])
  const [newSubject, setNewSubject] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchSections = async () => {
    try {
      const q = query(collection(db, "sections"), orderBy("order", "asc"))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Section[]
      setSections(data)

      const studentsSnap = await getDocs(collection(db, "students"))
      const counts: StudentCount = {}
      studentsSnap.docs.forEach((d) => {
        const sid = d.data().sectionId
        counts[sid] = (counts[sid] || 0) + 1
      })
      setStudentCounts(counts)
    } catch (err) {
      console.error("Failed to fetch sections:", err)
      toast.error("Failed to load sections")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSections()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setSubjects([])
    setNewSubject("")
    setShowDialog(true)
  }

  const openEdit = (section: Section) => {
    setEditing(section)
    setName(section.name)
    setSubjects([...section.subjects])
    setNewSubject("")
    setShowDialog(true)
  }

  const addSubject = () => {
    const trimmed = newSubject.trim()
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed])
      setNewSubject("")
    }
  }

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Section name is required")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateDoc(doc(db, "sections", editing.id), {
          name: name.trim(),
          subjects,
        })
        toast.success("Section updated")
      } else {
        await addDoc(collection(db, "sections"), {
          name: name.trim(),
          subjects,
          order: sections.length,
        })
        toast.success("Section added")
      }
      setShowDialog(false)
      await fetchSections()
    } catch (err) {
      console.error("Failed to save section:", err)
      toast.error("Failed to save section")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (section: Section) => {
    const count = studentCounts[section.id] || 0
    const msg = count > 0
      ? `Delete "${section.name}"? This section has ${count} student(s). Their data will remain but they will be unlinked.`
      : `Delete "${section.name}"?`
    if (!confirm(msg)) return

    try {
      await deleteDoc(doc(db, "sections", section.id))
      toast.success("Section deleted")
      await fetchSections()
    } catch (err) {
      console.error("Failed to delete section:", err)
      toast.error("Failed to delete section")
    }
  }

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    setSections(updated)

    try {
      await Promise.all(
        updated.map((s, i) =>
          updateDoc(doc(db, "sections", s.id), { order: i })
        )
      )
    } catch (err) {
      console.error("Failed to reorder:", err)
      toast.error("Failed to reorder sections")
      await fetchSections()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sections
          </h1>
          <p className="text-muted-foreground">
            Manage class sections and their subjects
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No sections yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first section to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sections.length - 1}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-card-foreground">
                    {section.name}
                  </p>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {studentCounts[section.id] || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {section.subjects.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No subjects configured
                    </span>
                  ) : (
                    section.subjects.map((subj) => (
                      <span
                        key={subj}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {subj}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/sections/${section.id}/students`}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Manage students"
                >
                  <Users className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => openEdit(section)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Edit section"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(section)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                {editing ? "Edit Section" : "Add Section"}
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
                  Section Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. KG, 1, 2A, 3 Boys"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Subjects
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSubject()
                      }
                    }}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Quran, Arabic"
                  />
                  <button
                    type="button"
                    onClick={addSubject}
                    className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    Add
                  </button>
                </div>
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {subjects.map((subj, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {subj}
                        <button
                          onClick={() => removeSubject(i)}
                          className="ml-0.5 rounded hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                  {editing ? "Update" : "Add"} Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
