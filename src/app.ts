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

class App {
  private express: express.Application
  public server: http.Server

  constructor() {
    this.express = express()
    this.middleware()
    this.routes()
    this.sockets()
  }

  private middleware() {
    this.express.use(helmet())
    this.express.use(cors())
    this.express.use(logger())
    this.express.use(express.json())
  }

  private routes() {
    this.express.use('/api', routes)
    this.express.use('/', swaggerUI.serve, swaggerUI.setup(swaggerConfig))
    this.express.use(errorHandler)
  }

  private sockets() {
    this.server = http.createServer(this.express)
    const io = new Server(this.server)
    sockets.configure(io)
  }
}

export default new App().server
