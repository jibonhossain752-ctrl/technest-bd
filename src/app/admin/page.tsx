import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import AdminDashboard from './AdminDashboard'

export const runtime = 'nodejs'

export default async function AdminPage() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!verifySessionToken(token)) {
    redirect('/admin/login')
  }
  return <AdminDashboard />
}
