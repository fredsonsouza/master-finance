import { auth } from '@/auth/auth'
import { type Department, getDepartments } from '@/http/departments'
import {
  type EmployeeBirthdaysResponse,
  getEmployeeBirthdays,
} from '@/http/employees'
import { type Unit, getUnits } from '@/http/get-units'
import { getDefaultHomeRoute, hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { BirthdaysContent } from './birthdays-content'

export const dynamic = 'force-dynamic'

export default async function BirthdaysPage() {
  const { user, token } = await auth()

  if (!hasPermission(user, 'birthdays:manage')) {
    redirect(getDefaultHomeRoute(user))
  }

  const canManageEmployees = hasPermission(user, 'employees:manage')
  const nowMonth = new Date().getMonth() + 1

  let initialData: EmployeeBirthdaysResponse = {
    referenceDate: '',
    month: nowMonth,
    upcomingDays: 7,
    monthBirthdays: [],
    upcomingAlerts: [],
    summary: {
      monthTotal: 0,
      todayCount: 0,
      upcomingCount: 0,
      missingBirthDateCount: 0,
    },
  }
  let units: Unit[] = []
  let departments: Department[] = []

  try {
    const [birthdaysRes, unitsRes, departmentsRes] = await Promise.all([
      getEmployeeBirthdays(token, {
        upcomingDays: 7,
        includePhotos: true,
      }).catch(() => null),
      getUnits(token).catch(() => ({ units: [] })),
      getDepartments(token).catch(() => ({ departments: [] })),
    ])

    if (birthdaysRes) {
      initialData = birthdaysRes
    }
    units = unitsRes.units || []
    departments = departmentsRes.departments || []
  } catch (err) {
    console.error(err)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Aniversariantes do Mês
          </h1>
          <p className="text-on-surface-variant">
            Acompanhe as datas comemorativas da equipe e gere cards
            personalizados para compartilhar.
          </p>
        </div>
      </div>

      <BirthdaysContent
        initialData={initialData}
        units={units}
        departments={departments}
        canManageEmployees={canManageEmployees}
      />
    </div>
  )
}
