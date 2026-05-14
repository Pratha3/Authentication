'use client'
import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useEventsStore } from '@/store/events.store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebouncedCallback } from 'use-debounce'

export function SearchBar() {
  const { filters, setFilters } = useEventsStore()
  const [value, setValue] = useState(filters.search ?? '')

  const debouncedSearch = useDebouncedCallback((v: string) => {
    setFilters({ search: v || undefined })
  }, 400)

  const handleChange = (v: string) => {
    setValue(v)
    debouncedSearch(v)
  }

  const clear = useCallback(() => {
    setValue('')
    setFilters({ search: undefined })
  }, [setFilters])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search events, venues, categories…"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
