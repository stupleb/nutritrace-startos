import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  jwtSecret: z.string().catch(''),
  tokenEncKey: z.string().catch(''),
  adminPassword: z.string().catch(''),
  primaryUrl: z.string().catch(''),
  smtp: smtpShape,
  apiAccess: z.enum(['off', 'read', 'write', 'full']).catch('off'),
  foodMirror: z.boolean().catch(false),
  regionalDefaults: z
    .object({
      language: z.string(),
      units: z.enum(['metric', 'imperial']),
      energy: z.enum(['kcal', 'kJ']),
      dateFormat: z.enum(['ISO', 'EU', 'US', 'natural']),
      timeFormat: z.enum(['24h', '12h']),
      foodCountry: z.string(),
      foodLanguage: z.string(),
    })
    .nullable()
    .catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
