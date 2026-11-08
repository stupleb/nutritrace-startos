import { sdk } from './sdk'
import { foodMirrorSubpath } from './utils'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main', 'startos').setOptions({
    // NutriTrace's own backup archives, each a dump of the database plus every uploaded image, and the downloadable food database.
    exclude: ['/backups/', `/${foodMirrorSubpath}/`],
  }),
)
