import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'
import z from 'zod'
import type { User } from './models/user'
import { permissions } from './permissions'
import { userSubject } from './subjects/user'
import { sectorSubject } from './subjects/sector'
import { itemSubject } from './subjects/item'
import { unitSubject } from './subjects/unit'
import { transactionSubject } from './subjects/transaction'
import { metricSubject } from './subjects/metric'

const appAbilitiesSchema = z.union([
  sectorSubject,
  userSubject,
  itemSubject,
  unitSubject,
  transactionSubject,
  metricSubject,

  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for role ${user.role} not found`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  return ability
}
