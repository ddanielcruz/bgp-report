import { Router } from 'express'

import { CollectorsController } from '../controllers/CollectorsController'

const router = Router()
const controller = new CollectorsController()

router.get('/', controller.index)
router.get('/:id', controller.show)

export default router
