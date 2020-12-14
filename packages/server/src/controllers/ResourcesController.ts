import { Request, Response } from 'express'

import FindResourceInformationService from '@services/FindResourceInformationService'

export default class ResourcesController {
  async show(request: Request, response: Response): Promise<Response> {
    const { params, query } = request
    const service = new FindResourceInformationService()
    const resource = await service.execute({
      resource: params.resource,
      ...query
    })

    return response.json(resource)
  }
}
