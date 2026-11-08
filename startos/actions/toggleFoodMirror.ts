import { rm } from 'node:fs/promises'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { foodMirrorSubpath } from '../utils'

export const toggleFoodMirror = sdk.Action.withoutInput(
  'toggle-food-mirror',

  async ({ effects }) => {
    const enabled = await storeJson.read((s) => s.foodMirror).const(effects)

    return {
      name: enabled
        ? i18n('Disable Local Food Database')
        : i18n('Enable Local Food Database'),
      description: enabled
        ? i18n(
            'NutriTrace keeps a copy of the Open Food Facts database on this server and searches it before the public Open Food Facts API. Run this action to stop using it and delete the copy. NutriTrace restarts to apply it.',
          )
        : i18n(
            'Download the Open Food Facts database (about 8 GB, refreshed weekly) to this server, so barcode and food searches are answered here instead of by the public Open Food Facts API. A product the copy lacks is still looked up publicly. NutriTrace restarts to apply it.',
          ),
      warning: enabled
        ? i18n(
            'Deletes the downloaded food database. Enabling it again downloads it again.',
          )
        : i18n(
            'Downloads about 8 GB from Hugging Face and needs about 16 GB free while a refresh replaces it. The copy is left out of backups and downloaded again after a restore.',
          ),
      allowedStatuses: 'any',
      group: i18n('Advanced'),
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const enabled = await storeJson.read((s) => s.foodMirror).once()
    await storeJson.merge(effects, { foodMirror: !enabled })
    if (enabled) {
      await rm(sdk.volumes.main.subpath(foodMirrorSubpath), {
        recursive: true,
        force: true,
      })
    }
  },
)
