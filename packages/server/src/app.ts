import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import 'express-async-errors'

import './database/connection'
import errorHandler from './middleware/errorHandler'
import logger from './middleware/logger'
import routes from './routes'

const app = express()
app.use(helmet())
app.use(cors())
app.use(logger())
app.use(express.json())
app.use('/api', routes)
app.use(errorHandler)

export default app
