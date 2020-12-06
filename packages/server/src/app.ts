import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import 'express-async-errors'

import logger from './middleware/logger'
import routes from './routes'

const app = express()
app.use(helmet())
app.use(cors())
app.use(logger())
app.use(express.json())
app.use('/api', routes)

export default app
