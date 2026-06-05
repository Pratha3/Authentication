'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, LayoutGrid, Map } from 'lucide-react'
import { useEventsStore } from '@/store/events.store'
import { EVENT_CATEGORIES, DISTANCE_OPTIONS, SORT_OPTIONS } from '@/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function EventFilters() {
  const { filters, setFilters, resetFilters, mapView, setMapView } = useEventsStore()
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = [
    filters.category?.length,
    filters.dateFrom,
    filters.isFree !== undefined,
    filters.distance,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Sort */}
      <select
        value={filters.sortBy ?? 'date'}
        onChange={(e) => setFilters({ sortBy: e.target.value as typeof filters.sortBy })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Filter button */}
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeCount}</Badge>
        )}
      </Button>

      {/* Map toggle */}
      <Button variant="outline" size="sm" onClick={() => setMapView(!mapView)} className={cn('gap-2', mapView && 'bg-accent')}>
        {mapView ? <LayoutGrid className="h-4 w-4" /> : <Map className="h-4 w-4" />}
        {mapView ? 'Grid' : 'Map'}
      </Button>

      {/* Reset */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
          <X className="h-3 w-3" />Clear
        </Button>
      )}

      {/* Expanded filters */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="rounded-xl border border-border/50 bg-card p-4 mt-2 space-y-4">
              {/* Categories */}
              <div>
                <p className="text-sm font-medium mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map(cat => {
                    const active = filters.category?.includes(cat.value)
                    return (
                      <button
                        key={cat.value}
                        onClick={() => {
                          const current = filters.category ?? []
                          setFilters({
                            category: active ? current.filter(c => c !== cat.value) : [...current, cat.value]
                          })
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-all',
                          active ? cat.color : 'border-border/50 text-muted-foreground hover:border-border'
                        )}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Price & Distance row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Price</p>
                  <div className="flex gap-2">
                    {[{ value: undefined, label: 'All' }, { value: true, label: 'Free' }, { value: false, label: 'Paid' }].map(opt => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setFilters({ isFree: opt.value })}
                        className={cn(
                          'flex-1 rounded-md border px-3 py-1.5 text-xs transition-all',
                          filters.isFree === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-border'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Distance</p>
                  <div className="flex gap-2 flex-wrap">
                    {DISTANCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters({ distance: filters.distance === opt.value ? undefined : opt.value })}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs transition-all',
                          filters.distance === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-border'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From</label>
                  <input type="date" value={filters.dateFrom ?? ''} onChange={(e) => setFilters({ dateFrom: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To</label>
                  <input type="date" value={filters.dateTo ?? ''} onChange={(e) => setFilters({ dateTo: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
