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
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  Circle,
  Calendar,
} from "lucide-react"

interface MarkingPeriod {
  id: string
  name: string
  isActive: boolean
  createdAt: number
}

export default function MarkingPeriodsPage() {
  const [periods, setPeriods] = useState<MarkingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<MarkingPeriod | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchPeriods = async () => {
    try {
      const q = query(
        collection(db, "markingPeriods"),
        orderBy("createdAt", "desc")
      )
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MarkingPeriod[]
      setPeriods(data)
    } catch (err) {
      console.error("Failed to fetch marking periods:", err)
      toast.error("Failed to load marking periods")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeriods()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setShowDialog(true)
  }

  const openEdit = (period: MarkingPeriod) => {
    setEditing(period)
    setName(period.name)
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
        await updateDoc(doc(db, "markingPeriods", editing.id), {
          name: name.trim(),
        })
        toast.success("Marking period updated")
      } else {
        await addDoc(collection(db, "markingPeriods"), {
          name: name.trim(),
          isActive: periods.length === 0,
          createdAt: Date.now(),
        })
        toast.success("Marking period created")
      }
      setShowDialog(false)
      await fetchPeriods()
    } catch (err) {
      console.error("Failed to save marking period:", err)
      toast.error("Failed to save marking period")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (period: MarkingPeriod) => {
    try {
      const batch = writeBatch(db)
      periods.forEach((p) => {
        batch.update(doc(db, "markingPeriods", p.id), {
          isActive: p.id === period.id,
        })
      })
      await batch.commit()
      toast.success(`"${period.name}" is now the active marking period`)
      await fetchPeriods()
    } catch (err) {
      console.error("Failed to toggle active:", err)
      toast.error("Failed to update active marking period")
    }
  }

  const handleDelete = async (period: MarkingPeriod) => {
    if (
      !confirm(
        `Delete "${period.name}"? Any grades associated with this marking period will remain but be unlinked.`
      )
    )
      return

    try {
      await deleteDoc(doc(db, "markingPeriods", period.id))
      toast.success("Marking period deleted")
      await fetchPeriods()
    } catch (err) {
      console.error("Failed to delete marking period:", err)
      toast.error("Failed to delete marking period")
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
            Marking Periods
          </h1>
          <p className="text-muted-foreground">
            Manage marking periods for report cards
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Period
        </button>
      </div>

      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            No marking periods yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first marking period to start grading
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => (
            <div
              key={period.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <button
                onClick={() => toggleActive(period)}
                className="shrink-0"
                title={
                  period.isActive
                    ? "Currently active"
                    : "Click to set as active"
                }
              >
                {period.isActive ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground">
                  {period.name}
                </p>
                {period.isActive && (
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(period)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(period)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
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
                {editing ? "Edit Marking Period" : "New Marking Period"}
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
                  placeholder="e.g. Midterms 2026, Finals 2026"
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
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
