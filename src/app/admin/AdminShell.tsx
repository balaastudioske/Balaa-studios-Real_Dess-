'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, PackageCheck } from 'lucide-react'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const items = [
    { href: '/admin', label: 'Live Events', icon: CalendarDays },
    { href: '/admin/orders', label: 'Orders & Licenses', icon: PackageCheck },
    { href: '/', label: '3D Stage View', icon: Home },
  ]

  return (
    <div className="flex h-screen w-full bg-[#080604] text-slate-100">
      <aside className="w-64 border-r border-orange-300/15 bg-[#100704]">
        <div className="p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#fb923c]">
            BALAA STUDIOS
          </h2>
          <p className="text-xs text-orange-200/50 mt-1">Control Operations</p>
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-orange-500/15 text-orange-300'
                    : 'text-slate-400 hover:bg-orange-500/10 hover:text-orange-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

