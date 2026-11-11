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

// Restoring a NutriTrace backup re-inserts users with their original created_at, so the trigger leaves restored accounts alone.
export const regionalTriggerScript = `
try {
// Dropped before db.js migrates: SQLite 3.45 refuses to rename a table while a trigger names one that is missing.
const { default: Database } = await import('better-sqlite3')
const raw = new Database(process.env.DB_PATH)
raw.exec('DROP TRIGGER IF EXISTS startos_regional_defaults')
raw.close()
const { default: db } = await import('./db.js')
const sql = (s) => "'" + String(s).replaceAll("'", "''") + "'"
const has = (table, cols) => cols.every((c) => db.prepare('PRAGMA table_info(' + table + ')').all().some((r) => r.name === c))
if (process.env.SETTINGS) {
  if (!has('users', ['id', 'created_at']) || !has('user_settings', ['user_id', 'key', 'value', 'updated_at']))
    throw new Error('the users or user_settings columns it needs have changed')
  const inserts = Object.entries(JSON.parse(process.env.SETTINGS)).map(([key, value]) =>
    \`INSERT OR IGNORE INTO user_settings (user_id, key, value, updated_at) VALUES (NEW.id, \${sql(key)}, \${sql(JSON.stringify(value))}, datetime('now'));\`)
  db.exec(\`CREATE TRIGGER startos_regional_defaults AFTER INSERT ON users
    WHEN julianday(NEW.created_at) >= julianday('now', '-1 minute')
    BEGIN \${inserts.join(' ')} END\`)
}
db.close()
console.log(process.env.SETTINGS ? 'Regional defaults: set for new accounts' : 'Regional defaults: off')
} catch (e) {
  if (!process.env.BEST_EFFORT) throw e
  console.error(\`Regional defaults not applied: \${e.message}\`)
}
`
