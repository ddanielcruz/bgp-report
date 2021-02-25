import { hasDuplicates } from './../helpers/hasDuplicates'
import axios from 'axios'
import Joi from '@hapi/joi'

import { AppError, PropertyError } from '../errors'

interface Params {
  resources?: string[]
  collectors?: number[]
  communities?: string[]
  timestamp?: number
}

interface RawResourcesState {
  resource: string | string[]
  bgp_state: {
    target_prefix: string
    source_id: string
    path: number[]
    community: string[]
  }[]
}

export interface Route {
  source: string
  collector: number
  peer: number
  path: number[]
  community: string[]
}

export interface ResourcesState {
  resources: string[]
  routes: Route[]
  prepends: Route[]
  timestamp: number
}

const validator = Joi.object<Params>().keys({
  resources: Joi.array().items(Joi.string().trim()).min(1).required(),
  collectors: Joi.array().items(Joi.number()).default([]),
  communities: Joi.array().items(Joi.string().trim()).default([]),
  timestamp: Joi.number()
})

export class FindResourcesState {
  async execute(params: Params): Promise<ResourcesState> {
    // 1.0 Validate received parameters using Joi (also normalize values)
    const normalizedParams = this.validate(params)

    // 2.0 Find resources state using RIS API
    const timestamp = new Date()
    const currentState = await this.fetchResourcesState(normalizedParams)

    // 3.0 Filter results by communities in case received any
    const { communities } = normalizedParams
    if (communities.length) {
      currentState.bgp_state = currentState.bgp_state.filter(route => {
        return route.community.some(comm => communities.includes(comm))
      })
    }

    // 4.0 Return resource state without parsing (it may be used later)
    return this.parseRawState(currentState, timestamp)
  }

  private validate(params: Params): Params {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (errors.length) {
      throw new AppError('Received parameters are not valid.', { data: errors })
    }

    return value
  }

  private async fetchResourcesState(params: Params): Promise<RawResourcesState> {
    const response = await axios.get('https://stat.ripe.net/data//bgp-state/data.json', {
      params: {
        resource: params.resources.join(','),
        rrcs: params.collectors.length ? params.collectors.join(',') : undefined,
        timestamp: params.timestamp
      }
    })

    return response.data.data
  }

  private parseRawState(rawState: RawResourcesState, timestamp: Date): ResourcesState {
    const routes: Route[] = []
    const prepends: Route[] = []
    const { resource, bgp_state } = rawState

    bgp_state.forEach(rawRoute => {
      const [collector, source] = rawRoute.source_id.split('-')
      const route: Route = {
        source: source,
        collector: parseInt(collector),
        peer: rawRoute.path[0],
        path: rawRoute.path,
        community: rawRoute.community
      }

      routes.push(route)
      if (hasDuplicates(route.path)) {
        prepends.push(route)
      }
    })

    return {
      resources: typeof resource === 'string' ? [resource] : resource,
      routes,
      prepends,
      timestamp: timestamp.getTime()
    }
  }
}
