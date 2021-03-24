import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import swaggerUI from 'swagger-ui-express'
import 'express-async-errors'

import '@core/database/connection'
import '@config/schedulers'
import swaggerConfig from '@config/swagger.json'

import { errorHandler, logger } from './middleware'
import { routes } from './routes'

const api = express()
api.use(helmet())
api.use(cors())
api.use(logger())
api.use(express.json())
api.use('/api', routes)
api.use('/', swaggerUI.serve, swaggerUI.setup(swaggerConfig))
api.use(errorHandler)

export { api }
