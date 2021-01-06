import { Router } from 'express'

import ResourcesController from '../controllers/ResourcesController'

const routes = Router()
const controller = new ResourcesController()

routes.get('/:resources', controller.show)

export default routes
