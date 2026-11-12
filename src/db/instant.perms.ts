import type { InstantRules } from '@instantdb/react'

const own = {
  allow: {
    view: "auth.id in data.ref('owner.id')",
    create: "auth.id in data.ref('owner.id')",
    update: "auth.id in data.ref('owner.id')",
    delete: "auth.id in data.ref('owner.id')",
  },
}

const rules = {
  profiles: own,
  sessions: own,
  matches: own,
  activities: own,
} satisfies InstantRules

export default rules
