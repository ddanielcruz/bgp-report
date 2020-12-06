import { Router } from 'express'

import rrcsRoutes from './rrcs.routes'

const routes = Router()
routes.use('/rrcs', rrcsRoutes)

export default routes
