import { Router } from 'express'

import collectorsRouter from './collectors.routes'

const router = Router()
router.use('/collectors', collectorsRouter)

export default router
