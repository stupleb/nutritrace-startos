import { T } from '@start9labs/start-sdk'
import { primaryUrl } from './actions/setPrimaryUrl'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { dbMount, dbPath, foodMirrorSubpath, rootCaPath, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting NutriTrace!'))

  const store = await storeJson
    .read((s) => ({
      jwtSecret: s.jwtSecret,
      tokenEncKey: s.tokenEncKey,
      smtp: s.smtp,
      apiAccess: s.apiAccess,
      foodMirror: s.foodMirror,
    }))
    .const(effects)
  if (!store?.jwtSecret || !store.tokenEncKey) {
    throw new Error('Generated secrets are missing from store.json')
  }

  let smtp: T.SmtpValue | null = null
  if (store.smtp.selection === 'system') {
    smtp = await sdk.getSystemSmtp(effects).const()
    const customFrom = store.smtp.value.customFrom
    if (smtp && customFrom) smtp = { ...smtp, from: customFrom }
  } else if (store.smtp.selection === 'custom') {
    const { host, from, username, password, security } =
      store.smtp.value.provider.value
    smtp = {
      host,
      from,
      username,
      password,
      port: Number(security.value.port),
      security: security.selection,
    }
  }

  const publicUrl = await primaryUrl.bestUsable(effects).const()
  const apiLevel = ['off', 'read', 'write', 'full'].indexOf(store.apiAccess)
  const foodMirrorPath = `/data/${foodMirrorSubpath}`

  const mounts = dbMount
    .mountVolume({
      volumeId: 'main',
      subpath: 'uploads',
      mountpoint: '/data/uploads',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'main',
      subpath: 'backups',
      mountpoint: '/data/backups',
      readonly: false,
    })

  const sub = sdk.SubContainer.of(
    effects,
    { imageId: 'nutritrace' },
    store.foodMirror
      ? mounts.mountVolume({
          volumeId: 'main',
          subpath: foodMirrorSubpath,
          mountpoint: foodMirrorPath,
          readonly: false,
        })
      : mounts,
    'nutritrace',
  )

  // Lets NutriTrace reach the HTTPS addresses StartOS gives other services, such as CookTrace, ntfy or Pocket ID.
  await sub.writeFile(rootCaPath, await sdk.getRootCa(effects))

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: sub,
    exec: {
      command: sdk.useEntrypoint(),
      env: {
        PORT: String(uiPort),
        DB_PATH: dbPath,
        UPLOADS_PATH: '/data/uploads',
        BACKUPS_PATH: '/data/backups',
        JWT_SECRET: store.jwtSecret,
        TOKEN_ENC_KEY: store.tokenEncKey,
        UPDATE_CHECK: 'off',
        NODE_EXTRA_CA_CERTS: rootCaPath,
        ...(publicUrl ? { PUBLIC_URL: publicUrl } : {}),
        // Set even when off: NutriTrace keeps env-seeded SMTP values, and their lock, until an env value replaces them.
        SMTP_HOST: smtp?.host ?? '',
        SMTP_PORT: smtp ? String(smtp.port) : '',
        SMTP_SECURE: String(smtp?.security === 'tls'),
        SMTP_USER: smtp?.username ?? '',
        SMTP_PASS: smtp?.password ?? '',
        SMTP_FROM: smtp?.from ?? '',
        WEBHOOKS_ENABLED: 'true',
        ALLOW_PRIVATE_WEBHOOK_URLS: 'true',
        MCP_ENABLED: String(apiLevel > 0),
        PUBLIC_API_ENABLED: String(apiLevel > 0),
        MCP_WRITE_ENABLED: String(apiLevel > 1),
        PUBLIC_API_WRITE_ENABLED: String(apiLevel > 1),
        MCP_DESTROY_ENABLED: String(apiLevel > 2),
        ...(store.foodMirror
          ? { OFF_LOCAL_DB: `${foodMirrorPath}/off.parquet` }
          : {}),
      },
    },
    ready: {
      display: i18n('Web Interface'),
      fn: () =>
        sdk.healthCheck.checkWebUrl(effects, `http://127.0.0.1:${uiPort}/`, {
          successMessage: i18n('The web interface is ready'),
          errorMessage: i18n('The web interface is not ready'),
        }),
    },
    requires: [],
  })
})
