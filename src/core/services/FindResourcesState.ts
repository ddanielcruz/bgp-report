import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { ResourcesState, IResourcesState, IResourcesRoute } from '@core/database/entities'
import { AppError, PropertyError } from '@core/errors'
import { hasDuplicates } from '@core/helpers'
import Joi from '@hapi/joi'

dayjs.extend(utc)

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

// TODO: Throw error if resource is not a valid prefix
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
    const timestamp = new Date()

    // 2.0 Verify if state already exists if not searching with timestamp
    let resourcesState: IResourcesState
    if (!normalizedParams.timestamp) {
      // 2.1 Find state by resources and collectors newer than 8 hours
      const timestamp = dayjs.utc().add(-8, 'hours').toDate().getTime()
      resourcesState = await ResourcesState.findOne({
        resources: normalizedParams.resources,
        collectors: normalizedParams.collectors,
        queriedAt: {
          $gt: timestamp
        }
      })
    }

    // 3.0 If didn't find any resources state search for it using RIS API
    if (!resourcesState) {
      const rawState = await this.fetchResourcesState(normalizedParams)
      resourcesState = this.parseRawState(rawState, normalizedParams, timestamp) as IResourcesState

      // 3.1 Upsert resources state in the database if user didn't pass a timestamp
      if (!params.timestamp) {
        resourcesState = await ResourcesState.findOneAndUpdate(
          { resources: resourcesState.resources, collectors: params.collectors },
          { $set: resourcesState },
          { upsert: true, new: true }
        )
      }
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

  private parseRawState(
    rawState: RawResourcesState,
    params: Params,
    timestamp: Date
  ): Partial<IResourcesState> {
    const routes: IResourcesRoute[] = []
    let prepends = 0
    const { bgp_state } = rawState

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
      resources: params.resources,
      collectors: params.collectors,
      routes,
      prepends,
      timestamp: timestamp.getTime(),
      queriedAt: this.parseQueryTime(rawState.query_time)
    }
  }

  private parseQueryTime(queryTime: string): number {
    try {
      return dayjs.utc(queryTime).toDate().getTime()
    } catch (error) {
      return Date.now()
    }
  }
}
