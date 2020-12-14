import { Router } from 'express'

import collectorsRoutes from './collectors.routes'
import routersRoutes from './resources.routes'

const routes = Router()
routes.use('/collectors', collectorsRoutes)
routes.use('/resources', routersRoutes)

export default routes
