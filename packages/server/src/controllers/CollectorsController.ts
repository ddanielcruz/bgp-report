import { Request, Response } from 'express'

import Collector from '@entities/Collector'

export default class CollectorsController {
  async index(_request: Request, response: Response): Promise<Response> {
    const collectors = await Collector.find({}, { routers: 0 })

    response.header('x-total-count', collectors.length.toString())
    return response.json(collectors)
  }

  async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params
    const collector = await Collector.findById(id)

    if (!collector) {
      return response.status(404).json({ error: 'Collector not found.' })
    }

    return response.json(collector)
  }
}
