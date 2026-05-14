'use client'
import { useCallback, useState } from 'react'
import { useEventsStore } from '@/store/events.store'
import type { UserLocation } from '@/types'

export function useLocation() {
  const { userLocation, setUserLocation, setFilters } = useEventsStore()
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setIsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setUserLocation(location)
        setFilters({ latitude: location.latitude, longitude: location.longitude })
        setIsDetecting(false)
        setError(null)
      },
      (err) => {
        setError(`Location access denied: ${err.message}`)
        setIsDetecting(false)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [setUserLocation, setFilters])

  return { userLocation, detectLocation, isDetecting, error }
}
