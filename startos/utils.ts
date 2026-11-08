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
