import cron from 'node-cron'

import ManageCollectorsService from '@services/ManageCollectorsService'

const manageCollectors = new ManageCollectorsService()
manageCollectors.execute()
cron.schedule('0 0 * * *', manageCollectors.execute)
