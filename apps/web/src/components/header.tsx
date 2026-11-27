import { auth } from '@/auth/auth'
import { getEmployeeBirthdays } from '@/http/employees'
import { hasPermission } from '@/lib/permissions'
import { Building2 } from 'lucide-react'
import { BirthdayAlertsBell } from './birthday-alerts-bell'
import { ProfileButton } from './profile-button'

export async function Header() {
  const { user, token } = await auth()
  const canManageBirthdays = hasPermission(user, 'birthdays:manage')

  let birthdayAlerts = null
  if (canManageBirthdays) {
    birthdayAlerts = await getEmployeeBirthdays(token, {
      upcomingDays: 7,
      includePhotos: false,
    }).catch(() => null)
  }

  return (
    <header className="h-16 shrink-0 border-b border-surface-container bg-surface flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        {user.unit?.name && (
          <div className="flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-xs font-medium text-on-surface-variant">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>{user.unit.name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {canManageBirthdays && (
          <BirthdayAlertsBell
            alerts={birthdayAlerts?.upcomingAlerts ?? []}
            referenceDate={birthdayAlerts?.referenceDate ?? ''}
            todayCount={birthdayAlerts?.summary.todayCount ?? 0}
            upcomingCount={birthdayAlerts?.summary.upcomingCount ?? 0}
          />
        )}
        <ProfileButton user={user} />
      </div>
    </header>
  )
}
