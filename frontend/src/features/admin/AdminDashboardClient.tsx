'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ShieldCheck, Loader2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { fetchAllUsers } from '@/services/api/profiles.service'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'
import { request } from '@/lib/api'
import type { Profile } from '@/types'

export function AdminDashboardClient() {
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAllUsers(page).then(({ data, count }) => {
      setUsers(data)
      setTotal(count)
      setIsLoading(false)
    })
  }, [page])

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await request(`/profiles/${userId}`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
      toast.success(isActive ? 'User suspended' : 'User reactivated')
    } catch { toast.error('Action failed') }
  }

  const roleColor: Record<string, string> = {
    admin: 'border-red-500/30 bg-red-500/10 text-red-400',
    organizer: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    user: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="container py-8 space-y-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Users</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold">{users.filter(u => u.role === 'organizer').length}</p>
            <p className="text-xs text-muted-foreground mt-1">Organizers</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Suspended</p>
          </div>
        </div>

        {/* Users table */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" />All Users</h2>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/40">
                  <tr>
                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`hover:bg-muted/20 ${!user.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url ?? ''} />
                            <AvatarFallback className="text-xs">{getInitials(user.full_name ?? user.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs capitalize ${roleColor[user.role]}`}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${user.is_active ? 'text-green-400' : 'text-destructive'}`}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1.5 text-xs ${user.is_active ? 'text-destructive hover:text-destructive' : ''}`}
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                        >
                          {user.is_active ? <><Ban className="h-3.5 w-3.5" />Suspend</> : 'Reactivate'}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
