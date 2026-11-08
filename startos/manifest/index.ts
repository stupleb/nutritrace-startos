import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nutritrace',
  title: 'NutriTrace',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/stupleb/nutritrace-startos',
  upstreamRepo: 'https://github.com/TraceApps/nutritrace',
  marketingUrl: 'https://traceapps.github.io/docs/nutritrace/',
  donationUrl: 'https://ko-fi.com/traceapps',
  description: { short, long },
  volumes: ['main', 'startos'],
  images: {
    nutritrace: {
      source: {
        dockerTag:
          'ghcr.io/traceapps/nutritrace:latest@sha256:2a7ddec27518660cfb71d5599b75a7bba65c41837f43d10519dfd1fd13b6dcbc',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
