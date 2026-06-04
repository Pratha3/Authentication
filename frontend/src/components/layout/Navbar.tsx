'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Compass, Menu, User, Zap, CalendarDays, LayoutDashboard, ShieldCheck, X } from 'lucide-react'
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
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore()
  const signOut = useSignOut()

  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const handleCategoriesClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      window.scrollTo({
        top: window.innerHeight * 2,
        behavior: 'smooth',
      })
    }
  }

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
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-5">
          <Link
            href={ROUTES.DISCOVER}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
              pathname === ROUTES.DISCOVER
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />Discover
          </Link>
          <Link
            href="/#categories"
            onClick={handleCategoriesClick}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            Categories
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href={ROUTES.BOOKMARKS} aria-label="Bookmarks" title="View Bookmarks">
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
            <div className="flex items-center gap-4 animate-in fade-in" role="group" aria-label="Account Actions">
              <Button variant="ghost" asChild size="default" className="h-9 px-4 hover:text-foreground/90 transition-colors font-semibold text-sm">
                <Link href={ROUTES.LOGIN}>Sign in</Link>
              </Button>
              <Button asChild size="default" className="h-9 px-5 shadow-lg shadow-primary/20 hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm cursor-pointer">
                <Link href={ROUTES.SIGNUP}>Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border p-6 shadow-2xl flex flex-col gap-6 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <Link href={ROUTES.HOME} onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 font-bold text-xl">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Zap className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span>EventSphere</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-col gap-3">
                <Link
                  href={ROUTES.DISCOVER}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === ROUTES.DISCOVER
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Compass className="h-4 w-4" />Discover
                </Link>

                {user && (
                  <>
                    <Link
                      href={ROUTES.BOOKMARKS}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                        pathname === ROUTES.BOOKMARKS
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Bookmark className="h-4 w-4" />Bookmarks
                    </Link>
                    <Link
                      href={ROUTES.REGISTERED}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                        pathname === ROUTES.REGISTERED
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />My Registrations
                    </Link>
                    <Link
                      href={ROUTES.PROFILE}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                        pathname === ROUTES.PROFILE
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <User className="h-4 w-4" />Profile
                    </Link>
                    {isOrganizer && (
                      <Link
                        href={ROUTES.ORGANIZER.DASHBOARD}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === ROUTES.ORGANIZER.DASHBOARD
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <LayoutDashboard className="h-4 w-4" />Organizer Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href={ROUTES.ADMIN}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === ROUTES.ADMIN
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />Admin Panel
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Bottom Actions */}
              <div className="mt-auto border-t border-border pt-4 flex flex-col gap-3">
                {user ? (
                  <Button variant="destructive" onClick={() => { setSidebarOpen(false); signOut(); }} className="w-full justify-start gap-2">
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start"><Link href={ROUTES.LOGIN} onClick={() => setSidebarOpen(false)}>Sign in</Link></Button>
                    <Button asChild className="w-full justify-start"><Link href={ROUTES.SIGNUP} onClick={() => setSidebarOpen(false)}>Get started</Link></Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
