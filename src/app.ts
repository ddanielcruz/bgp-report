import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import swaggerUI from 'swagger-ui-express'
import 'express-async-errors'

import './database/connection'
import './config/schedulers'
import * as sockets from './config/sockets'
import swaggerConfig from './config/swagger.json'
import { errorHandler, logger } from './middleware'
import { routes } from './routes'

class App {
  public express: express.Application

  constructor() {
    this.express = express()

    this.middleware()
    this.routes()
  }

  middleware() {
    this.express.use(helmet())
    this.express.use(cors())
    this.express.use(logger())
    this.express.use(express.json())
  }

  routes() {
    this.express.use('/api', routes)
    this.express.use('/', swaggerUI.serve, swaggerUI.setup(swaggerConfig))
    this.express.use(errorHandler)
  }

  sockets() {
    const server = createServer(this.express)
    const io = new Server(server)
    sockets.configure(io)
  }
}

export default new App().express
