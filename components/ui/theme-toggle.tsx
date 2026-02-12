"use client"

import React from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "../../lib/utils"
import { useApp } from "../../store"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useApp()
  const isDark = theme === "dark"

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 shadow-inner",
        isDark 
          ? "bg-zinc-950 border border-zinc-800" 
          : "bg-slate-200 border border-slate-300",
        className
      )}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 shadow-sm",
            isDark 
              ? "transform translate-x-0 bg-zinc-800" 
              : "transform translate-x-8 bg-white"
          )}
        >
          {isDark ? (
            <Moon 
              className="w-3.5 h-3.5 text-white" 
              strokeWidth={1.5}
            />
          ) : (
            <Sun 
              className="w-3.5 h-3.5 text-amber-500" 
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark 
              ? "bg-transparent" 
              : "transform -translate-x-8"
          )}
        >
          {isDark ? (
            <Sun 
              className="w-3.5 h-3.5 text-zinc-600" 
              strokeWidth={1.5}
            />
          ) : (
            <Moon 
              className="w-3.5 h-3.5 text-slate-400" 
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )
}