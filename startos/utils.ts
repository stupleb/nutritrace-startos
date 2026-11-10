import { utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3001
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'
export const adminUsername = 'admin'
export const dbPath = '/data/db/nutritrace.db'
export const rootCaPath = '/usr/local/share/startos-root-ca.crt'
export const foodMirrorSubpath = 'off-mirror'

export const randomString = (len: number) =>
  utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len })

export const dbMount = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'db',
  mountpoint: '/data/db',
  readonly: false,
})

// Importing the image's db.js creates or migrates the schema, so this works before NutriTrace has ever started.
export const setAdminScript = `
import bcrypt from 'bcryptjs'
import db from './db.js'
import { claimAnonymousData } from './lib/claim-anonymous-data.js'
const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env
const hash = bcrypt.hashSync(password, 12)
const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
if (user) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(hash, user.id)
} else {
  const first = !db.prepare('SELECT 1 FROM users LIMIT 1').get()
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')")
    .run(username, hash)
  if (first) claimAnonymousData(lastInsertRowid)
}
db.close()
`

// The keys and values below are NutriTrace's own (src/stores/settings.js and src/routes/settings/).
export const uiLanguages: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  ru: 'Русский',
}

export const foodLanguages: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
  ko: '한국어',
}

export const foodCountries = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Poland',
  'Portugal',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
  'United States',
]

export const nutritraceDefaults = {
  language: 'en',
  units: 'imperial',
  energy: 'kcal',
  dateFormat: 'US',
  timeFormat: '12h',
  foodCountry: 'World',
  foodLanguage: 'en',
} as const

export const regionalSettings = (d: {
  language: string
  units: 'metric' | 'imperial'
  energy: 'kcal' | 'kJ'
  dateFormat: 'ISO' | 'EU' | 'US' | 'natural'
  timeFormat: '24h' | '12h'
  foodCountry: string
  foodLanguage: string
}) => ({
  language: d.language,
  energyUnit: d.energy,
  dateFormat: d.dateFormat,
  timeFormat: d.timeFormat,
  offSearchCountry: d.foodCountry,
  offSearchLanguage: d.foodLanguage,
  ...(d.units === 'metric'
    ? {
        weightUnit: 'kg',
        heightUnit: 'cm',
        lengthUnit: 'cm',
        distUnit: 'km',
        tempUnit: 'C',
        waterUnit: 'ml',
      }
    : {
        weightUnit: 'lb',
        heightUnit: 'ft',
        lengthUnit: 'in',
        distUnit: 'mi',
        tempUnit: 'F',
        waterUnit: 'oz',
      }),
})

// Fills each setting for accounts with no row or a cleared one, and moves rows still on the PREVIOUS default; other values are kept.
export const applyRegionalScript = `
try {
const { default: db } = await import('./db.js')
const settings = JSON.parse(process.env.SETTINGS)
const previous = JSON.parse(process.env.PREVIOUS || '{}')
const fill = db.prepare(\`INSERT INTO user_settings (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), deleted_at = NULL
  WHERE user_settings.deleted_at IS NOT NULL\`)
const move = db.prepare(\`UPDATE user_settings SET value = ?, updated_at = datetime('now')
  WHERE user_id = ? AND key = ? AND value = ? AND deleted_at IS NULL\`)
let written = 0
db.transaction(() => {
  for (const { id } of db.prepare('SELECT id FROM users').all()) {
    for (const [key, value] of Object.entries(settings)) {
      written += fill.run(id, key, JSON.stringify(value)).changes
      if (key in previous && previous[key] !== value) {
        written += move.run(JSON.stringify(value), id, key, JSON.stringify(previous[key])).changes
      }
    }
  }
})()
db.close()
console.log(\`Regional defaults: \${written} settings filled in\`)
} catch (e) {
  if (!process.env.BEST_EFFORT) throw e
  console.error(\`Regional defaults not applied: \${e.message}\`)
}
`
