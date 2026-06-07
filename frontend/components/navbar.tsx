"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scale, BookOpen, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/measure", icon: Scale, label: "Measure" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="liquid-glass-nav fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-6 py-3">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-3 transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
