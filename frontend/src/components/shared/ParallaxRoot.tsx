'use client'

import { useEffect } from 'react'

export function ParallaxRoot() {
  useEffect(() => {
    let frame = 0

    const updateScrollPosition = () => {
      frame = 0
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateScrollPosition)
    }

    updateScrollPosition()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.style.removeProperty('--scroll-y')
    }
  }, [])

  return null
}
