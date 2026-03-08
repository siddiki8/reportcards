"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface TeacherAuthContextType {
  isAuthenticated: boolean
  authenticate: () => void
  logout: () => void
}

const TeacherAuthContext = createContext<TeacherAuthContextType>({
  isAuthenticated: false,
  authenticate: () => {},
  logout: () => {},
})

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const flag = sessionStorage.getItem("teacher_authenticated")
    setIsAuthenticated(flag === "true")
  }, [])

  const authenticate = () => {
    sessionStorage.setItem("teacher_authenticated", "true")
    setIsAuthenticated(true)
  }

  const logout = () => {
    sessionStorage.removeItem("teacher_authenticated")
    setIsAuthenticated(false)
  }

  return (
    <TeacherAuthContext.Provider value={{ isAuthenticated, authenticate, logout }}>
      {children}
    </TeacherAuthContext.Provider>
  )
}

export function useTeacherAuth() {
  return useContext(TeacherAuthContext)
}
