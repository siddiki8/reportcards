"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { MessageSquareText } from "lucide-react"

interface CommentCode {
  id: string
  code: number
  text: string
}

interface CommentCodePickerProps {
  allCodes: CommentCode[]
  selectedCodes: number[]
  onChange: (codes: number[]) => void
}

export function CommentCodePicker({
  allCodes,
  selectedCodes,
  onChange,
}: CommentCodePickerProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
  }, [open])

  const toggleCode = (code: number) => {
    const newCodes = selectedCodes.includes(code)
      ? selectedCodes.filter((c) => c !== code)
      : [...selectedCodes, code].sort((a, b) => a - b)
    onChange(newCodes)
  }

  const modal = mounted && open && allCodes.length > 0 && (
    <div
      ref={containerRef}
      className="fixed z-50 rounded-lg border border-border bg-card p-2 shadow-lg min-w-[220px] max-h-[240px] overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {allCodes.map((c) => (
        <label
          key={c.id}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer hover:bg-secondary"
        >
          <input
            type="checkbox"
            checked={selectedCodes.includes(c.code)}
            onChange={() => toggleCode(c.code)}
            className="h-3.5 w-3.5 rounded border-input text-primary accent-primary"
          />
          <span className="font-semibold text-card-foreground w-5 shrink-0">
            {c.code}
          </span>
          <span className="text-muted-foreground truncate">{c.text}</span>
        </label>
      ))}
    </div>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors ${
          selectedCodes.length > 0
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary"
        }`}
        title="Comment codes"
      >
        <MessageSquareText className="h-3 w-3" />
        {selectedCodes.length > 0 && (
          <span className="font-medium">{selectedCodes.join(", ")}</span>
        )}
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
