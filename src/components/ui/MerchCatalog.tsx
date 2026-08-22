'use client'

import { useState, useMemo } from 'react'
import { ShoppingBag, ArrowUpRight, X } from 'lucide-react'
import { MERCH_CATALOG, type MerchProduct } from '@/lib/merch/catalog'

type FilterCategory = 'all' | MerchProduct['category']

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: 'All',
  hoodie: 'Hoodies',
  tshirt: 'T-Shirts',
  sweater: 'Sweaters',
  jacket: 'Jackets',
  accessory: 'Accessories',
  digital: 'Digital',
}

export function MerchCatalog() {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [selected, setSelected] = useState<MerchProduct | null>(null)

  const products = useMemo(() => {
    if (filter === 'all') return MERCH_CATALOG.filter((p) => p.available)
    return MERCH_CATALOG.filter((p) => p.available && p.category === filter)
  }, [filter])

  const categories = useMemo(() => {
    const cats = new Set<FilterCategory>(['all'])
    MERCH_CATALOG.forEach((p) => cats.add(p.category))
    return Array.from(cats)
  }, [])

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 font-mono">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filter === cat
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-orange-200/60 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelected(product)}
            className="group rounded-xl border border-orange-500/25 bg-[#140a05]/70 p-3 text-left transition-all hover:border-orange-400/50 hover:bg-[#140a05]/95 shadow-lg"
          >
            <div
              className={`mb-3 h-16 rounded-lg bg-gradient-to-br ${product.gradient} transition-transform group-hover:scale-[1.02]`}
            />
            <p className="truncate text-xs font-bold text-white">{product.name}</p>
            <p className="mt-0.5 text-[10px] text-orange-300/60 capitalize font-mono">{product.category}</p>
            <p className="mt-1 text-xs font-black text-amber-400 font-mono">
              ${product.price}
            </p>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-orange-500/30 bg-gradient-to-b from-[#1c0e07] to-[#0d0704] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-orange-500/30 text-orange-200 hover:bg-orange-500/20"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={`mb-4 h-32 rounded-xl bg-gradient-to-br ${selected.gradient}`}
            />

            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 font-mono">
              BALAA STUDIOS Merch
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{selected.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-orange-100/70 font-sans">
              {selected.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-1 font-mono">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300 border border-orange-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xl font-black text-amber-400 font-mono">
                ${selected.price}
              </span>
              <button
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#140a05] shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition"
                onClick={() =>
                  window.alert(
                    `Order placed for ${selected.name}. Support/Till: 5834631`,
                  )
                }
              >
                <ShoppingBag className="h-4 w-4" />
                Order Merch
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
