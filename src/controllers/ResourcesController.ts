import { Request, Response } from 'express'

import { FindResourcesState } from '../services/FindResourcesState'

const parseParameters = ({ query }: Request) => {
  const splitByComma = (name: string) => {
    let property = query[name]
    if (Array.isArray(property)) {
      property = property[0]
    }

    return property?.toString()?.split(',') ?? []
  }

  return {
    resources: splitByComma('resources'),
    collectors: splitByComma('collectors'),
    communities: splitByComma('communities'),
    timestamp: query?.timestamp?.toString()
  }
}

export class ResourcesController {
  async show(request: Request, response: Response) {
    const parameters: any = parseParameters(request)
    const service = new FindResourcesState()
    const state = await service.execute(parameters)

    return response.json(state)
  }
}
