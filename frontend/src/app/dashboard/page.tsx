import { redirect } from 'next/navigation'

// Legacy route — redirect to the new discover page
export default function DashboardPage() {
  redirect('/discover')
}
