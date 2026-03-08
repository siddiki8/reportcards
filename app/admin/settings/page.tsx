"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export default function SettingsPage() {
  const [teacherPassword, setTeacherPassword] = useState("")
  const [schoolName, setSchoolName] = useState("Darul Islah Sunday School")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [pwDoc, schoolDoc] = await Promise.all([
          getDoc(doc(db, "settings", "teacherPassword")),
          getDoc(doc(db, "settings", "school")),
        ])
        if (pwDoc.exists()) {
          setTeacherPassword(pwDoc.data().password || "")
        }
        if (schoolDoc.exists()) {
          setSchoolName(schoolDoc.data().name || "Darul Islah Sunday School")
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSavePassword = async () => {
    if (!teacherPassword.trim()) {
      toast.error("Password cannot be empty")
      return
    }
    setSaving(true)
    try {
      await setDoc(doc(db, "settings", "teacherPassword"), {
        password: teacherPassword.trim(),
      })
      toast.success("Teacher password updated")
    } catch (err) {
      console.error("Failed to save password:", err)
      toast.error("Failed to save password")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchool = async () => {
    if (!schoolName.trim()) {
      toast.error("School name cannot be empty")
      return
    }
    setSaving(true)
    try {
      await setDoc(
        doc(db, "settings", "school"),
        { name: schoolName.trim() },
        { merge: true }
      )
      toast.success("School settings updated")
    } catch (err) {
      console.error("Failed to save school settings:", err)
      toast.error("Failed to save school settings")
    } finally {
      setSaving(false)
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage application settings
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            Teacher Password
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This password is shared with all teachers to access the grade entry
            portal.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="teacher-password"
                className="text-sm font-medium text-card-foreground"
              >
                Password
              </label>
              <input
                id="teacher-password"
                type="text"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter teacher password"
              />
            </div>
            <button
              onClick={handleSavePassword}
              disabled={saving}
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Password
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            School Information
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This information appears on generated report cards.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="school-name"
                className="text-sm font-medium text-card-foreground"
              >
                School Name
              </label>
              <input
                id="school-name"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter school name"
              />
            </div>
            <button
              onClick={handleSaveSchool}
              disabled={saving}
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save School Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
