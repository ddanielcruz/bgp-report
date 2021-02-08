import { Request, Response } from 'express'

import FindResourceInformationService from '@services/FindResourceInformationService'

export default class ResourcesController {
  async show(request: Request, response: Response): Promise<Response> {
    const { query } = request
    if (!query.resources) {
      return response.status(400).json({
        error: 'Resources not provided.'
      })
    }

    const service = new FindResourceInformationService()
    const resources = await service.execute(query)

    return response.json(resources)
  }
}
