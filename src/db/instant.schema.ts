import { i } from '@instantdb/react'

const _schema = i.schema({
  entities: {
    $users: i.entity({ email: i.string().unique().indexed().optional() }),
    profiles: i.entity({
      name: i.string(),
      ranks: i.json().optional(),
      askMmr: i.boolean().optional(),
      idleMinutes: i.number().optional(),
      lastMode: i.string().optional(),
      customActivities: i.json().optional(),
      createdAt: i.number(),
    }),
    sessions: i.entity({
      startedAt: i.number().indexed(),
      endedAt: i.number().optional(),
      lastActivityAt: i.number(),
    }),
    matches: i.entity({
      mode: i.string(),
      result: i.string(),
      rank: i.string().optional(),
      mmr: i.number().optional(),
      playedAt: i.number().indexed(),
    }),
    activities: i.entity({
      kind: i.string(),
      type: i.string(),
      startedAt: i.number().indexed(),
      endedAt: i.number().optional(),
      note: i.string().optional(),
    }),
  },
  links: {
    profileOwner: { forward: { on: 'profiles', has: 'one', label: 'owner' }, reverse: { on: '$users', has: 'one', label: 'profile' } },
    sessionOwner: { forward: { on: 'sessions', has: 'one', label: 'owner' }, reverse: { on: '$users', has: 'many', label: 'sessions' } },
    matchOwner: { forward: { on: 'matches', has: 'one', label: 'owner' }, reverse: { on: '$users', has: 'many', label: 'matches' } },
    activityOwner: { forward: { on: 'activities', has: 'one', label: 'owner' }, reverse: { on: '$users', has: 'many', label: 'activities' } },
    sessionMatches: { forward: { on: 'matches', has: 'one', label: 'session' }, reverse: { on: 'sessions', has: 'many', label: 'matches' } },
    sessionActivities: { forward: { on: 'activities', has: 'one', label: 'session' }, reverse: { on: 'sessions', has: 'many', label: 'activities' } },
  },
})

type _AppSchema = typeof _schema
export interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema
export default schema
