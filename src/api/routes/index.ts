import { Router } from 'express'

import collectorsRoutes from './collectors.routes'
import routersRoutes from './resources.routes'

const router = Router()
router.use('/collectors', collectorsRoutes)
router.use('/resources', routersRoutes)

export default router
