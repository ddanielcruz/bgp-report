import { Router } from 'express'

import ResourcesController from '../controllers/ResourcesController'

const routes = Router()
const controller = new ResourcesController()

routes.get('/:resource', controller.show)

export default routes
