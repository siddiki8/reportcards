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
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  MessageSquareText,
} from "lucide-react"

interface CommentCode {
  id: string
  code: number
  text: string
}

const DEFAULT_COMMENT_CODES: Array<{ code: number; text: string }> = [
  { code: 1, text: "Respectful and Well Behaved" },
  { code: 2, text: "Tries Their Best" },
  { code: 3, text: "Participates Actively in Class" },
  { code: 4, text: "Completes Assignments on Time" },
  { code: 5, text: "Follows Directions Carefully" },
  { code: 6, text: "Shows Kindness and Cooperation" },
  { code: 7, text: "Demonstrates Steady Improvement" },
  { code: 8, text: "Comes Prepared and Ready to Learn" },
  { code: 9, text: "Needs Reminders to Stay Focused" },
  { code: 10, text: "Often Has Missing or Incomplete Work" },
  { code: 11, text: "Disrupts Class and Needs Behavior Improvement" },
  { code: 12, text: "Request Parent Conference" },
]

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<CommentCode | null>(null)
  const [code, setCode] = useState("")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [seedingDefaults, setSeedingDefaults] = useState(false)

  const fetchComments = async () => {
    try {
      const q = query(collection(db, "commentCodes"), orderBy("code", "asc"))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CommentCode[]
      setComments(data)
    } catch (err) {
      console.error("Failed to fetch comments:", err)
      toast.error("Failed to load comment codes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [])

  const openAdd = () => {
    setEditing(null)
    const nextCode =
      comments.length > 0
        ? Math.max(...comments.map((c) => c.code)) + 1
        : 1
    setCode(String(nextCode))
    setText("")
    setShowDialog(true)
  }

  const openEdit = (comment: CommentCode) => {
    setEditing(comment)
    setCode(String(comment.code))
    setText(comment.text)
    setShowDialog(true)
  }

  const handleSave = async () => {
    const codeNum = parseInt(code, 10)
    if (isNaN(codeNum) || codeNum < 0) {
      toast.error("Code must be a valid number")
      return
    }
    if (!text.trim()) {
      toast.error("Comment text is required")
      return
    }

    const duplicate = comments.find(
      (c) => c.code === codeNum && c.id !== editing?.id
    )
    if (duplicate) {
      toast.error(`Code ${codeNum} is already in use`)
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await updateDoc(doc(db, "commentCodes", editing.id), {
          code: codeNum,
          text: text.trim(),
        })
        toast.success("Comment code updated")
      } else {
        await addDoc(collection(db, "commentCodes"), {
          code: codeNum,
          text: text.trim(),
        })
        toast.success("Comment code added")
      }
      setShowDialog(false)
      await fetchComments()
    } catch (err) {
      console.error("Failed to save comment code:", err)
      toast.error("Failed to save comment code")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (comment: CommentCode) => {
    if (!confirm(`Delete comment code ${comment.code}?`)) return

    try {
      await deleteDoc(doc(db, "commentCodes", comment.id))
      toast.success("Comment code deleted")
      await fetchComments()
    } catch (err) {
      console.error("Failed to delete comment code:", err)
      toast.error("Failed to delete comment code")
    }
  }

  const handleLoadDefaults = async () => {
    setSeedingDefaults(true)
    try {
      const q = query(collection(db, "commentCodes"), orderBy("code", "asc"))
      const snap = await getDocs(q)
      const existingCodes = new Set(
        snap.docs.map((d) => (d.data() as { code?: number }).code).filter((c): c is number => typeof c === "number")
      )

      const missingDefaults = DEFAULT_COMMENT_CODES.filter(
        (item) => !existingCodes.has(item.code)
      )

      if (missingDefaults.length === 0) {
        toast.success("Default comment codes are already loaded")
        return
      }

      await Promise.all(
        missingDefaults.map((item) =>
          addDoc(collection(db, "commentCodes"), {
            code: item.code,
            text: item.text,
          })
        )
      )

      toast.success(`Added ${missingDefaults.length} default comment code(s)`)
      await fetchComments()
    } catch (err) {
      console.error("Failed to load default comment codes:", err)
      toast.error("Failed to load default comment codes")
    } finally {
      setSeedingDefaults(false)
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comment Codes
          </h1>
          <p className="text-muted-foreground">
            Manage comment codes used on report cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadDefaults}
            disabled={seedingDefaults}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {seedingDefaults ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquareText className="h-4 w-4" />
            )}
            Load Default 12 Codes
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Code
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <MessageSquareText className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            No comment codes yet
          </p>
          <p className="text-sm text-muted-foreground">
            Add codes like &quot;1 - Respectful&quot; or &quot;13 - Needs conference&quot;
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-20">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Comment Text
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr
                  key={comment.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {comment.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-card-foreground">
                    {comment.text}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(comment)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
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
                {editing ? "Edit Comment Code" : "Add Comment Code"}
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
                  Code Number
                </label>
                <input
                  type="number"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="1"
                  min={0}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Comment Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSave()
                    }
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Respectful and well-behaved"
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
                  {editing ? "Update" : "Add"} Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
