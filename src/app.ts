import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import http from 'http'
import { Server } from 'socket.io'
import swaggerUI from 'swagger-ui-express'
import 'express-async-errors'

import './database/connection'
import './config/schedulers'
import * as sockets from './config/sockets'
import swaggerConfig from './config/swagger.json'
import { errorHandler, logger } from './middleware'
import { routes } from './routes'

const app = express()
app.use(helmet())
app.use(cors())
app.use(logger())
app.use(express.json())
app.use('/api', routes)
app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerConfig))
app.use(errorHandler)

const server = http.createServer(app)
const io = new Server(server)
sockets.configure(io)

export default server
