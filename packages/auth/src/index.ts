import {
  AbilityBuilder,
  type CreateAbility,
  type MongoAbility,
  createMongoAbility,
} from '@casl/ability'
import z from 'zod'
import type { User } from './models/user'
import { permissions } from './permissions'
import { categorySubject } from './subjects/category'
import { itemSubject } from './subjects/item'
import { metricSubject } from './subjects/metric'
import { sectorSubject } from './subjects/sector'
import { transactionSubject } from './subjects/transaction'
import { unitSubject } from './subjects/unit'
import { userSubject } from './subjects/user'

import { cashClosureSubject } from './subjects/cash-closure'
import { collectionSubject } from './subjects/collection'
import { evaluationSubject } from './subjects/evaluation'

const appAbilitiesSchema = z.union([
  categorySubject,
  sectorSubject,
  userSubject,
  itemSubject,
  unitSubject,
  transactionSubject,
  metricSubject,
  cashClosureSubject,
  collectionSubject,
  evaluationSubject,

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
