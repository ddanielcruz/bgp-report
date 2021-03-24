import axios from 'axios'
import dayjs from 'dayjs'

import { ResourcesState, IResourcesState, IResourcesRoute } from '@core/database/entities'
import { AppError, PropertyError } from '@core/errors'
import { hasDuplicates } from '@core/helpers'
import Joi from '@hapi/joi'

interface Params {
  resources: string[]
  collectors: number[]
  communities?: string[]
  timestamp?: number
}

interface RawResourcesState {
  resource: string | string[]
  query_time: string
  bgp_state: {
    target_prefix: string
    source_id: string
    path: number[]
    community: string[]
  }[]
}

const validator = Joi.object<Params>().keys({
  resources: Joi.array().items(Joi.string().trim()).min(1).required(),
  collectors: Joi.array().items(Joi.number()).default([]),
  communities: Joi.array().items(Joi.string().trim()).default([]),
  timestamp: Joi.number()
})

export class FindResourcesState {
  async execute(params: Params): Promise<Partial<IResourcesState>> {
    // 1.0 Validate received parameters using Joi (also normalize values)
    const normalizedParams = this.validate(params)

    // 2.0 Find resources state using RIS API
    const timestamp = new Date()
    const currentState = await this.fetchResourcesState(normalizedParams)

    // 3.0 Parse resources state and upsert it in the database if user didn't pass a timestamp
    let resourcesState = this.parseRawState(currentState, timestamp)
    if (!params.timestamp) {
      resourcesState = await ResourcesState.findOneAndUpdate(
        { resources: resourcesState.resources, collectors: params.collectors },
        { $set: { ...resourcesState, collectors: params.collectors } },
        { upsert: true, new: true }
      )
    }

    // 4.0 After storing it in the database, filter the communities in case received any
    const { communities } = params
    if (communities.length) {
      resourcesState.routes = resourcesState.routes.filter(route => {
        return route.community.some(comm => communities.includes(comm))
      })
    }

    return resourcesState
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
        rrcs: params.collectors.length ? params.collectors.join(',') : undefined, //
        timestamp: params.timestamp
      }
    })

    return response.data.data
  }

  private parseRawState(rawState: RawResourcesState, timestamp: Date): Partial<IResourcesState> {
    const routes: IResourcesRoute[] = []
    let prepends = 0
    const { resource, bgp_state } = rawState

    bgp_state.forEach(rawRoute => {
      const [collector, source] = rawRoute.source_id.split('-')
      const route: IResourcesRoute = {
        source: source,
        collector: parseInt(collector),
        peer: rawRoute.path[0],
        path: rawRoute.path,
        community: rawRoute.community,
        prepend: hasDuplicates(rawRoute.path)
      }

      routes.push(route)
      if (route.prepend) {
        prepends++
      }
    })

    return {
      resources: typeof resource === 'string' ? [resource] : resource,
      routes,
      prepends,
      timestamp: timestamp.getTime(),
      queriedAt: this.parseQueryTime(rawState.query_time)
    }
  }

  private parseQueryTime(queryTime: string): number {
    try {
      const parsedDate = dayjs(queryTime).toDate()
      return parsedDate.getTime()
    } catch (error) {
      return Date.now()
    }
  }
}
