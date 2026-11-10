export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting NutriTrace!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The NutriTrace web app and API. The Android app and other Trace apps connect here too.': 5,

  // actions/setAdminPassword.ts
  'Set Admin Password': 6,
  'Create the NutriTrace admin account, or give it a new random password.': 7,
  'Replaces the current admin password. Devices already signed in stay signed in.': 8,
  'NutriTrace Admin': 9,
  'Sign in to NutriTrace with these credentials.': 10,
  Username: 11,
  Password: 12,

  // init/watchAdminPassword.ts
  'Create the NutriTrace admin account so you can sign in for the first time.': 13,

  // actions/setPrimaryUrl.ts
  'Set Primary URL': 14,
  'Choose the address NutriTrace puts in its links: invitations, password resets, shared foods and meals, and weekly summaries. A running NutriTrace restarts to apply it.': 15,
  'Primary URL': 16,
  'Pick an address everyone who gets a link can reach. Until you pick one, NutriTrace uses a public domain if this interface has one, otherwise its .local address.': 17,

  // actions/manageSmtp.ts
  'Configure SMTP': 18,
  "Let NutriTrace send email: password resets, invitations, sharing notices and weekly summaries. NutriTrace's Settings > Email (SMTP) shows it read-only. NutriTrace restarts to apply it.": 19,

  // actions/setApiAccess.ts
  Access: 20,
  'What a client can do with an API token that holds the matching mcp:read, mcp:write or mcp:destroy scope. Edit and delete apply to MCP only; the REST API has no such routes.': 21,
  Off: 22,
  Read: 23,
  'Read and log': 24,
  'Read, log, edit and delete': 25,
  'Configure API Access': 26,
  'Turn on the MCP endpoint (/api/mcp) for AI assistants and the personal REST API (/api/v1) for your own scripts. Each client also needs an API token an admin creates in Settings > API Tokens. NutriTrace restarts to apply it.': 27,

  // actions/toggleFoodMirror.ts
  'Disable Local Food Database': 28,
  'Enable Local Food Database': 29,
  'NutriTrace keeps a copy of the Open Food Facts database on this server and searches it before the public Open Food Facts API. Run this action to stop using it and delete the copy. NutriTrace restarts to apply it.': 30,
  'Download the Open Food Facts database (about 8 GB, refreshed weekly) to this server, so barcode and food searches are answered here instead of by the public Open Food Facts API. A product the copy lacks is still looked up publicly. NutriTrace restarts to apply it.': 31,
  'Deletes the downloaded food database. Enabling it again downloads it again.': 32,
  'Downloads about 8 GB from Hugging Face and needs about 16 GB free while a refresh replaces it. The copy is left out of backups and downloaded again after a restore.': 33,
  Advanced: 34,

  // actions/setRegionalDefaults.ts
  Language: 35,
  'The language NutriTrace opens in.': 36,
  Units: 37,
  'For body weight, height, measurements, distance, temperature and water.': 38,
  'Metric (kg, cm, km, °C, ml)': 39,
  'Imperial (lb, ft/in, mi, °F, fl oz)': 40,
  Energy: 41,
  'Calories (kcal)': 42,
  'Kilojoules (kJ)': 43,
  'Date format': 44,
  'Time format': 45,
  '24-hour': 46,
  '12-hour': 47,
  'Food search country': 48,
  'Open Food Facts searches show only products sold in this country.': 49,
  Anywhere: 50,
  'Food search language': 51,
  'Open Food Facts searches show products in this language, with their names in it where available.': 52,
  'Set Regional Defaults': 53,
  'Choose the language, units, date and time formats and food search region that NutriTrace accounts start with. It fills them in for every account that has not chosen them, now and each time NutriTrace starts, and never changes a choice someone has made.': 54,
  'Regional Defaults Saved': 55,
  'NutriTrace filled in ${count} settings for accounts that had not chosen them. Accounts created later get them the next time NutriTrace starts.': 56,
  'Fill in these defaults': 57,
  'Turn off to stop filling them in. Settings already filled in stay as they are.': 58,
  'Regional Defaults Turned Off': 59,
  'NutriTrace no longer fills in regional defaults. Settings already filled in stay as they are.': 60,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
