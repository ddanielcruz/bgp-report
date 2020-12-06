import { Request, Response } from 'express'

import RRC from '@entities/RRC'

export default class RRCsController {
  async index(_request: Request, response: Response): Promise<Response> {
    const rrcs = await RRC.find()

    response.header('x-total-count', rrcs.length.toString())
    return response.json(rrcs)
  }

  async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params
    const rrc = await RRC.findById(id)

    if (!rrc) {
      return response.status(404).json({ error: 'RRC not found.' })
    }

    return response.json(rrc)
  }
}
