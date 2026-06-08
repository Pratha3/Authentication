import React from 'react'
import {
  Footprints,
  Users,
  Coffee,
  PartyPopper,
  Home,
  Music,
  Trophy,
  Cpu,
  Utensils,
  Palette,
  Sparkles,
  Briefcase,
  Trees,
  Wrench,
  HeartHandshake,
  HelpCircle,
  type LucideProps
} from 'lucide-react'
import type { EventCategory } from '@/types'

const iconMap: Record<EventCategory, React.ComponentType<LucideProps>> = {
  marathon: Footprints,
  meetup: Users,
  cafe: Coffee,
  club: PartyPopper,
  community: Home,
  music: Music,
  sports: Trophy,
  tech: Cpu,
  food: Utensils,
  art: Palette,
  wellness: Sparkles,
  business: Briefcase,
  outdoor: Trees,
  workshop: Wrench,
  charity: HeartHandshake,
  other: Sparkles,
}

interface CategoryIconProps extends LucideProps {
  category: EventCategory
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  const IconComponent = iconMap[category] || HelpCircle
  return <IconComponent {...props} />
}
