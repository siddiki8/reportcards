"use client"

import { useEffect, useRef, useState } from "react"
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react"

interface Section {
  id: string
  name: string
  order: number
}

interface PreviewRow {
  grade: string
  name: string
  sectionId: string | null
  sectionName: string | null
}

function normalizeSectionName(value: string) {
  return value.toLowerCase().trim()
}

function parseCSVRows(text: string, sections: Section[]): PreviewRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const dataLines =
    lines[0]?.toLowerCase().startsWith("grade") ? lines.slice(1) : lines

  const sectionLookup = new Map<string, Section>()
  for (const sec of sections) {
    sectionLookup.set(normalizeSectionName(sec.name), sec)
  }

  return dataLines
    .map((line) => {
      const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim())
      const grade = parts[0] ?? ""
      // grade,firstname,lastname (3+ cols) or grade,name (2 cols)
      const studentName =
        parts.length >= 3
          ? `${parts[1]} ${parts[2]}`.trim()
          : (parts[1] ?? "")
      if (!studentName) return null
      const matched = sectionLookup.get(normalizeSectionName(grade))
      return {
        grade,
        name: studentName,
        sectionId: matched?.id ?? null,
        sectionName: matched?.name ?? null,
      }
    })
    .filter((r): r is PreviewRow => r !== null)
}

export default function ImportStudentsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loadingSections, setLoadingSections] = useState(true)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchSections() {
      try {
        const snap = await getDocs(
          query(collection(db, "sections"), orderBy("order", "asc"))
        )
        setSections(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Section))
        )
      } catch {
        toast.error("Failed to load sections")
      } finally {
        setLoadingSections(false)
      }
    }
    fetchSections()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (!file) return
    const text = await file.text()
    setPreview(parseCSVRows(text, sections))
    setFileName(file.name)
  }

  const handleImport = async () => {
    if (!preview) return
    const importableRows = preview.filter((r) => normalizeSectionName(r.grade))
    if (importableRows.length === 0) {
      toast.error("No rows have a valid section name")
      return
    }

    setImporting(true)
    try {
      const sectionLookup = new Map<string, Section>()
      for (const section of sections) {
        sectionLookup.set(normalizeSectionName(section.name), section)
      }

      const missingSections = new Map<string, string>()
      for (const row of importableRows) {
        const key = normalizeSectionName(row.grade)
        if (!key || sectionLookup.has(key) || missingSections.has(key)) continue
        missingSections.set(key, row.grade.trim())
      }

      let nextOrder = sections.length
      const createdSections: Section[] = []
      for (const [key, name] of missingSections) {
        const sectionRef = await addDoc(collection(db, "sections"), {
          name,
          subjects: ["Period 1", "Period 2", "Period 3"],
          order: nextOrder,
        })

        const createdSection: Section = {
          id: sectionRef.id,
          name,
          order: nextOrder,
        }
        sectionLookup.set(key, createdSection)
        createdSections.push(createdSection)
        nextOrder += 1
      }

      const resolvedRows = importableRows
        .map((row) => {
          const section = sectionLookup.get(normalizeSectionName(row.grade))
          if (!section) return null
          return {
            ...row,
            sectionId: section.id,
            sectionName: section.name,
          }
        })
        .filter((r): r is PreviewRow => r !== null)

      const studentsSnap = await getDocs(collection(db, "students"))
      const orderMap: Record<string, number> = {}
      studentsSnap.docs.forEach((d) => {
        const sid = d.data().sectionId as string
        orderMap[sid] = (orderMap[sid] ?? 0) + 1
      })

      const localOffset: Record<string, number> = {}
      await Promise.all(
        resolvedRows.map((row) => {
          const sid = row.sectionId!
          localOffset[sid] = (localOffset[sid] ?? 0) + 1
          const order = (orderMap[sid] ?? 0) + localOffset[sid] - 1
          return addDoc(collection(db, "students"), {
            name: row.name,
            sectionId: sid,
            order,
          })
        })
      )

      if (createdSections.length > 0) {
        setSections((prev) => [...prev, ...createdSections])
      }

      toast.success(
        `Imported ${resolvedRows.length} student${resolvedRows.length !== 1 ? "s" : ""}${createdSections.length > 0 ? ` and created ${createdSections.length} new section${createdSections.length !== 1 ? "s" : ""}` : ""}`
      )
      setPreview(null)
      setFileName("")
    } catch (err) {
      console.error("Import failed:", err)
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  const matched = preview?.filter((r) => r.sectionId) ?? []
  const willCreate =
    preview?.filter((r) => !r.sectionId && normalizeSectionName(r.grade)) ?? []
  const invalidRows =
    preview?.filter((r) => !r.sectionId && !normalizeSectionName(r.grade)) ?? []
  const importCount = matched.length + willCreate.length

  if (loadingSections) {
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
          Import Students
        </h1>
        <p className="text-muted-foreground">
          Bulk-add students across all sections from a CSV file
        </p>
      </div>

      {/* Format instructions */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <p className="text-sm font-semibold text-card-foreground">CSV Format</p>
        <p className="text-sm text-muted-foreground">
          The first column must be the{" "}
          <span className="font-medium text-card-foreground">
            grade / section name
          </span>{" "}
          — if it does not match an existing section, a new section will be
          created automatically. Two formats are accepted:
        </p>
        <div className="flex flex-col gap-1.5">
          <code className="rounded bg-secondary px-3 py-1.5 text-xs font-mono text-secondary-foreground">
            grade,name
          </code>
          <code className="rounded bg-secondary px-3 py-1.5 text-xs font-mono text-secondary-foreground">
            grade,firstname,lastname
          </code>
        </div>
        <p className="text-xs text-muted-foreground">
          A header row is optional — any row where the first cell starts with
          &ldquo;grade&rdquo; will be skipped automatically.
        </p>
        {sections.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground">
              Your sections:
            </span>
            {sections.map((s) => (
              <code
                key={s.id}
                className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-secondary-foreground"
              >
                {s.name}
              </code>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input — always mounted so the ref is stable */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop zone (no preview yet) */}
      {!preview && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-16 gap-3 hover:border-primary/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground/60" />
          <div className="text-center">
            <p className="font-medium text-card-foreground">
              Click to upload CSV
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              grade,name &nbsp;or&nbsp; grade,firstname,lastname
            </p>
          </div>
        </button>
      )}

      {/* Preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          {/* File bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{fileName}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {preview.length} rows
              </span>
            </div>
            <button
              onClick={() => {
                setPreview(null)
                setFileName("")
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {willCreate.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-primary">
                {willCreate.length} row{willCreate.length !== 1 ? "s" : ""} use
                section names that do not exist yet. These sections will be
                created:{" "}
                {[...new Set(willCreate.map((r) => `"${r.grade}"`))].join(", ")}
              </p>
            </div>
          )}

          {invalidRows.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">
                {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""}{" "}
                have a blank section name and will be skipped.
              </p>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5 text-sm text-card-foreground">
                      {row.grade}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-card-foreground">
                      {row.name}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {row.sectionId ? (
                        <span className="flex items-center gap-1.5 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {row.sectionName}
                        </span>
                      ) : normalizeSectionName(row.grade) ? (
                        <span className="flex items-center gap-1.5 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Will create
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Missing section
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-muted-foreground">
              {importCount} student{importCount !== 1 ? "s" : ""} will be
              imported
              {invalidRows.length > 0
                ? `, ${invalidRows.length} will be skipped`
                : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                Choose different file
              </button>
              <button
                onClick={handleImport}
                disabled={importing || importCount === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {importCount} Student
                {importCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
