import { hasAdminSession } from '@/lib/admin-auth'
import { AdminLogin } from './AdminLogin'
import { AdminShell } from './AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) return <AdminLogin />
  return <AdminShell>{children}</AdminShell>
}
