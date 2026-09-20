"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, User, Ruler } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

const navItems = [
  { href: "/measure", icon: Ruler, label: "Measure" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const lastScrollY = useRef(0)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return

      const currentScrollY = window.scrollY

      // Scrolling down - hide navbar
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        navRef.current.classList.add(
          "translate-y-32",
          "opacity-0",
          "pointer-events-none"
        )
        navRef.current.classList.remove("translate-y-0", "opacity-100")
      }
      // Scrolling up - show navbar
      else if (currentScrollY < lastScrollY.current) {
        navRef.current.classList.add("translate-y-0", "opacity-100")
        navRef.current.classList.remove(
          "translate-y-32",
          "opacity-0",
          "pointer-events-none"
        )
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      className="liquid-glass-nav fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 translate-y-0 items-center gap-2 rounded-full p-2 opacity-100 transition-all duration-300"
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-3 transition-colors",
              active ? "text-foreground" : "text-muted-foreground"
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
