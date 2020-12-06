import { Router } from 'express'

import CollectorsController from '../controllers/CollectorsController'

const routes = Router()
const controller = new CollectorsController()

routes.get('/', controller.index)
routes.get('/:id', controller.show)

export default routes
