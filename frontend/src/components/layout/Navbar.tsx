'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Bookmark, Compass, Menu, User, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { useUIStore } from '@/store/ui.store'
import { useSignOut } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { getInitials } from '@/lib/utils'
import { ROUTES } from '@/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile } = useAuthStore()
  const { unreadCount } = useNotificationsStore()
  const { toggleSidebar } = useUIStore()
  const signOut = useSignOut()

  const navLinks = [
    { href: ROUTES.DISCOVER, label: 'Discover', icon: Compass },
  ]

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

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
                pathname === href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href={ROUTES.BOOKMARKS}>
                  <Bookmark className="h-5 w-5" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href={ROUTES.NOTIFICATIONS}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url ?? ''} alt={profile?.full_name ?? ''} />
                      <AvatarFallback>{getInitials(profile?.full_name ?? 'U')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.PROFILE}><User className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.REGISTERED}><Compass className="mr-2 h-4 w-4" />My Events</Link>
                  </DropdownMenuItem>
                  {profile?.role === 'organizer' || profile?.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.ORGANIZER.DASHBOARD}><Zap className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                  ) : null}
                  {profile?.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.ADMIN}><Zap className="mr-2 h-4 w-4" />Admin Panel</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild size="sm">
                <Link href={ROUTES.LOGIN}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={ROUTES.SIGNUP}>Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
