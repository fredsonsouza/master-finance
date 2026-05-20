import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ role: 'ADMIN' })

const userCanInviteSomeoneElse = ability.can('create', 'Sector')

console.log(userCanInviteSomeoneElse) // true
