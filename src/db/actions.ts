import { id, type TransactionChunk } from '@instantdb/react'
import type { AppSchema } from './instant.schema'
import { activeSession, runningActivity } from '../lib/session'
import type { ActivityKind, Match, Profile, Session } from '../lib/types'
import { db } from './client'

export async function createProfile(userId: string, name: string): Promise<void> {
  await db.transact(db.tx.profiles[id()].update({ name: name.trim(), createdAt: Date.now(), askMmr: false, idleMinutes: 45, lastMode: '2v2', ranks: {}, customActivities: { warmup: [], training: [] } }).link({ owner: userId }))
}

export async function updateProfile(profileId: string, patch: Partial<Omit<Profile, 'id'>>): Promise<void> {
  await db.transact(db.tx.profiles[profileId].update(patch))
}

export async function startSession(userId: string, sessions: Session[]): Promise<string> {
  const existing = activeSession(sessions)
  if (existing) return existing.id
  const sid = id()
  const now = Date.now()
  await db.transact(db.tx.sessions[sid].update({ startedAt: now, lastActivityAt: now }).link({ owner: userId }))
  return sid
}

export async function endSession(s: Session, endedAt: number): Promise<void> {
  const txs: TransactionChunk<AppSchema, keyof AppSchema['entities']>[] = [db.tx.sessions[s.id].update({ endedAt })]
  const running = runningActivity(s)
  if (running) txs.push(db.tx.activities[running.id].update({ endedAt: Math.max(running.startedAt, endedAt) }))
  await db.transact(txs)
}

export async function snoozeIdle(sessionId: string, now: number): Promise<void> {
  await db.transact(db.tx.sessions[sessionId].update({ lastActivityAt: now }))
}

export async function addMatch(userId: string, sessionId: string, fields: Omit<Match, 'id'>): Promise<string> {
  const mid = id()
  await db.transact(db.tx.matches[mid].update(fields).link({ owner: userId, session: sessionId }))
  return mid
}

export async function setMatchMmr(matchId: string, mmr: number): Promise<void> {
  await db.transact(db.tx.matches[matchId].update({ mmr }))
}

export async function deleteMatch(matchId: string): Promise<void> {
  await db.transact(db.tx.matches[matchId].delete())
}

export async function startActivity(userId: string, s: Session, kind: ActivityKind, type: string, now: number): Promise<string> {
  const aid = id()
  const txs: TransactionChunk<AppSchema, 'activities'>[] = [db.tx.activities[aid].update({ kind, type, startedAt: now }).link({ owner: userId, session: s.id })]
  const running = runningActivity(s)
  if (running) txs.unshift(db.tx.activities[running.id].update({ endedAt: Math.max(running.startedAt, now) }))
  await db.transact(txs)
  return aid
}

export async function stopActivity(activityId: string, endedAt: number, note?: string): Promise<void> {
  const clean = note?.trim()
  await db.transact(db.tx.activities[activityId].update(clean ? { endedAt, note: clean } : { endedAt }))
}

export async function deleteActivity(activityId: string): Promise<void> {
  await db.transact(db.tx.activities[activityId].delete())
}

export async function deleteSession(s: Session): Promise<void> {
  await db.transact([
    ...s.matches.map((x) => db.tx.matches[x.id].delete()),
    ...s.activities.map((a) => db.tx.activities[a.id].delete()),
    db.tx.sessions[s.id].delete(),
  ])
}
