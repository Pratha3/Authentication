'use client'
import { motion } from 'framer-motion'
import { EVENT_CATEGORIES, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { useEventsStore } from '@/store/events.store'
import { useRouter } from 'next/navigation'

import { CategoryIcon } from './CategoryIcon'

export function CategoryGrid() {
  const { setFilters } = useEventsStore()
  const router = useRouter()

  const handleCategoryClick = (category: string) => {
    setFilters({ category: [category] })
    router.push(ROUTES.DISCOVER)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory -mx-6 px-6 sm:-mx-8 sm:px-8">
      {EVENT_CATEGORIES.map((cat, i) => (
        <motion.button
          key={cat.value}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => handleCategoryClick(cat.value)}
          className={cn(
            'group flex w-36 shrink-0 snap-start min-h-28 flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center shadow-sm transition-all',
            'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
            cat.color
          )}
        >
          <span className="transition-transform group-hover:scale-110">
            <CategoryIcon category={cat.value} className="h-7 w-7" />
          </span>
          <span className="text-xs font-semibold leading-tight">{cat.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
