import { init } from '@instantdb/react'
import schema from './instant.schema'

export const appId: string = import.meta.env.VITE_INSTANT_APP_ID ?? ''
export const hasAppId = appId.length > 0

export const db = init({ appId: appId || '00000000-0000-0000-0000-000000000000', schema })
