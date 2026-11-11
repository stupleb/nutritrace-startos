import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  dbMount,
  dbPath,
  foodCountries,
  foodLanguages,
  nutritraceDefaults,
  regionalSettings,
  regionalTriggerScript,
  uiLanguages,
} from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  fill: Value.toggle({
    name: i18n('Use for new accounts'),
    description: i18n(
      "When on, every account created from now on starts with these settings. Turn off to give new accounts NutriTrace's own defaults again. Existing accounts are never changed.",
    ),
    default: true,
  }),
  language: Value.select({
    name: i18n('Language'),
    description: i18n('The language NutriTrace opens in.'),
    default: nutritraceDefaults.language,
    values: uiLanguages,
  }),
  units: Value.select({
    name: i18n('Units'),
    description: i18n(
      'For body weight, height, measurements, distance, temperature and water.',
    ),
    default: nutritraceDefaults.units,
    values: {
      metric: i18n('Metric (kg, cm, km, °C, ml)'),
      imperial: i18n('Imperial (lb, ft/in, mi, °F, fl oz)'),
    },
  }),
  energy: Value.select({
    name: i18n('Energy'),
    description: null,
    default: nutritraceDefaults.energy,
    values: {
      kcal: i18n('Calories (kcal)'),
      kJ: i18n('Kilojoules (kJ)'),
    },
  }),
  dateFormat: Value.select({
    name: i18n('Date format'),
    description: null,
    default: nutritraceDefaults.dateFormat,
    values: {
      ISO: 'YYYY-MM-DD',
      EU: 'DD/MM/YYYY',
      US: 'MM/DD/YYYY',
      natural: 'D MMM YYYY',
    },
  }),
  timeFormat: Value.select({
    name: i18n('Time format'),
    description: null,
    default: nutritraceDefaults.timeFormat,
    values: {
      '24h': i18n('24-hour'),
      '12h': i18n('12-hour'),
    },
  }),
  foodCountry: Value.select({
    name: i18n('Food search country'),
    description: i18n(
      'Open Food Facts searches show only products sold in this country.',
    ),
    default: nutritraceDefaults.foodCountry,
    values: Object.fromEntries([
      ['World', i18n('Anywhere')],
      ...foodCountries.map((c) => [c, c]),
    ]),
  }),
  foodLanguage: Value.select({
    name: i18n('Food search language'),
    description: i18n(
      'Open Food Facts searches show products in this language, with their names in it where available.',
    ),
    default: nutritraceDefaults.foodLanguage,
    values: foodLanguages,
  }),
})

export const setRegionalDefaults = sdk.Action.withInput(
  'set-regional-defaults',

  async ({ effects }) => ({
    name: i18n('Set Regional Defaults'),
    description: i18n(
      'Choose the language, units, date and time formats and food search region that new NutriTrace accounts start with. An account gets them the moment it is created; existing accounts keep their settings.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const stored = await storeJson
      .read((s) => s.regionalDefaults)
      .const(effects)
    return { fill: !!stored, ...(stored ?? nutritraceDefaults) }
  },

  async ({ effects, input: { fill, ...defaults } }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nutritrace' },
      dbMount,
      'set-regional-defaults',
      (sub) =>
        sub.execFail(
          ['node', '--input-type=module', '-e', regionalTriggerScript],
          {
            cwd: '/app',
            env: {
              DB_PATH: dbPath,
              ...(fill
                ? { SETTINGS: JSON.stringify(regionalSettings(defaults)) }
                : {}),
            },
            timeout: 60_000,
          },
        ),
    )
    await storeJson.merge(effects, { regionalDefaults: fill ? defaults : null })

    return fill
      ? {
          version: '1',
          title: i18n('Regional Defaults Saved'),
          message: i18n(
            'New accounts start with these settings from now on. Existing accounts keep theirs.',
          ),
          result: null,
        }
      : {
          version: '1',
          title: i18n('Regional Defaults Turned Off'),
          message: i18n(
            "New accounts start with NutriTrace's own defaults again. Existing accounts keep their settings.",
          ),
          result: null,
        }
  },
)
