import { Router } from 'express'

import collectorsRoutes from './collectors.routes'

const routes = Router()
routes.use('/collectors', collectorsRoutes)

export default routes
