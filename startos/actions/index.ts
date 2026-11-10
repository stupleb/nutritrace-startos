import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { setAdminPassword } from './setAdminPassword'
import { setApiAccess } from './setApiAccess'
import { primaryUrl } from './setPrimaryUrl'
import { setRegionalDefaults } from './setRegionalDefaults'
import { toggleFoodMirror } from './toggleFoodMirror'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(primaryUrl.action)
  .addAction(manageSmtp)
  .addAction(setApiAccess)
  .addAction(setRegionalDefaults)
  .addAction(toggleFoodMirror)
