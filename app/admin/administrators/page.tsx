"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  UserCog,
} from "lucide-react"

export interface Administrator {
  name: string
  position: string
  email: string
  phone: string
}

const MAX_ADMINS = 5

export default function AdministratorsPage() {
  const [admins, setAdmins] = useState<Administrator[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const fetchAdmins = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "administrators"))
      if (snap.exists()) {
        setAdmins((snap.data().list as Administrator[]) ?? [])
      }
    } catch (err) {
      console.error("Failed to fetch administrators:", err)
      toast.error("Failed to load administrators")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const saveAdmins = async (updated: Administrator[]) => {
    await setDoc(doc(db, "settings", "administrators"), { list: updated })
  }

  const openAdd = () => {
    setEditingIndex(null)
    setName("")
    setPosition("")
    setEmail("")
    setPhone("")
    setShowDialog(true)
  }

  const openEdit = (index: number) => {
    const a = admins[index]
    setEditingIndex(index)
    setName(a.name)
    setPosition(a.position)
    setEmail(a.email)
    setPhone(a.phone)
    setShowDialog(true)
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!position.trim()) {
      toast.error("Position is required")
      return
    }
    if (!validateEmail(email)) {
      toast.error("A valid email address is required")
      return
    }

    const entry: Administrator = {
      name: name.trim(),
      position: position.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    }

    setSaving(true)
    try {
      let updated: Administrator[]
      if (editingIndex !== null) {
        updated = admins.map((a, i) => (i === editingIndex ? entry : a))
      } else {
        if (admins.length >= MAX_ADMINS) {
          toast.error(`Maximum of ${MAX_ADMINS} administrators allowed`)
          return
        }
        updated = [...admins, entry]
      }
      await saveAdmins(updated)
      setAdmins(updated)
      setShowDialog(false)
      toast.success(editingIndex !== null ? "Administrator updated" : "Administrator added")
    } catch (err) {
      console.error("Failed to save administrator:", err)
      toast.error("Failed to save administrator")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (index: number) => {
    const admin = admins[index]
    if (!confirm(`Remove ${admin.name} from administrators?`)) return
    try {
      const updated = admins.filter((_, i) => i !== index)
      await saveAdmins(updated)
      setAdmins(updated)
      toast.success("Administrator removed")
    } catch (err) {
      console.error("Failed to remove administrator:", err)
      toast.error("Failed to remove administrator")
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
            Administrators
          </h1>
          <p className="text-muted-foreground">
            Manage up to {MAX_ADMINS} administrators whose contact info appears on report cards
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={admins.length >= MAX_ADMINS}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Administrator
        </button>
      </div>

      {admins.length >= MAX_ADMINS && (
        <p className="text-sm text-muted-foreground">
          Maximum of {MAX_ADMINS} administrators reached.
        </p>
      )}

      {admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <UserCog className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No administrators yet</p>
          <p className="text-sm text-muted-foreground">
            Add up to {MAX_ADMINS} administrators to display their contact info on report cards
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-card-foreground">
                    {admin.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-card-foreground">
                    {admin.position}
                  </td>
                  <td className="px-4 py-3 text-sm text-card-foreground">
                    {admin.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {admin.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(index)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Remove"
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
                {editingIndex !== null ? "Edit Administrator" : "Add Administrator"}
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
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Dr. Ahmad Hassan"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Position <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Principal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. principal@school.org"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Phone Number{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSave()
                    }
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. (555) 123-4567"
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
                  {editingIndex !== null ? "Update" : "Add"} Administrator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
