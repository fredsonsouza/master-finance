import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ id: '123', role: 'ADMIN' })

const userCanInviteSomeoneElse = ability.can('create', 'Sector')

console.log(userCanInviteSomeoneElse) // true
