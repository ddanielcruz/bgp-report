import { Router } from 'express'

import RRCsController from '../controllers/RRCsController'

const routes = Router()
const controller = new RRCsController()

routes.get('/', controller.index)
routes.get('/:id', controller.show)

export default routes
