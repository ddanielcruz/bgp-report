import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import 'express-async-errors'

import routes from './routes'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api', routes)

export default app
