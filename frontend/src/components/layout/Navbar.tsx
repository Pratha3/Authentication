'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bookmark, Compass, Menu, User, Zap, CalendarDays, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useSignOut } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { getInitials } from '@/lib/utils'
import { ROUTES } from '@/constants'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const signOut = useSignOut()

  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <Link href={ROUTES.HOME} className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block">EventSphere</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href={ROUTES.DISCOVER}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
              pathname === ROUTES.DISCOVER
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <Compass className="h-4 w-4" />Discover
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href={ROUTES.BOOKMARKS} aria-label="Bookmarks">
                  <Bookmark className="h-5 w-5" />
                </Link>
              </Button>

              {/* Real-time notification dropdown */}
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url ?? ''} alt={profile?.full_name ?? ''} />
                      <AvatarFallback className="text-xs">{getInitials(profile?.full_name ?? 'U')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="pb-2">
                    <p className="font-semibold text-sm">{profile?.full_name ?? 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <span className="mt-1 inline-block text-[10px] rounded-full px-1.5 py-0.5 bg-primary/10 text-primary capitalize font-medium">
                      {profile?.role ?? 'user'}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.PROFILE}><User className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.REGISTERED}><CalendarDays className="mr-2 h-4 w-4" />My Registrations</Link>
                  </DropdownMenuItem>
                  {isOrganizer && (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.ORGANIZER.DASHBOARD}><LayoutDashboard className="mr-2 h-4 w-4" />Organizer Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.ADMIN}><ShieldCheck className="mr-2 h-4 w-4" />Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild size="sm"><Link href={ROUTES.LOGIN}>Sign in</Link></Button>
              <Button asChild size="sm"><Link href={ROUTES.SIGNUP}>Get started</Link></Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
