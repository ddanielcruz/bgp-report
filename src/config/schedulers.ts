import cron from 'node-cron'

import { ManageCollectors } from '@core/services/ManageCollectors'

const manageCollectors = new ManageCollectors()
manageCollectors.execute()
cron.schedule('0 0 * * *', manageCollectors.execute)
