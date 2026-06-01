'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { EVENT_CATEGORIES, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { useEventsStore } from '@/store/events.store'
import { useRouter } from 'next/navigation'

export function CategoryGrid() {
  const { setFilters } = useEventsStore()
  const router = useRouter()

  const handleCategoryClick = (category: string) => {
    setFilters({ category: [category] })
    router.push(ROUTES.DISCOVER)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
      {EVENT_CATEGORIES.map((cat, i) => (
        <motion.button
          key={cat.value}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => handleCategoryClick(cat.value)}
          className={cn(
            'group flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center shadow-sm transition-all',
            'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
            cat.color
          )}
        >
          <span className="text-3xl transition-transform group-hover:scale-110">{cat.emoji}</span>
          <span className="text-xs font-semibold leading-tight">{cat.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
