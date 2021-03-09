import Joi from '@hapi/joi'

import { AppError } from './../errors/AppError'
import { PropertyError } from './../errors/PropertyError'
import { FindResourcesState, ResourcesState } from './FindResourcesState'

export interface FindResourcesStateLiveParams {
  resources: string[]
  collectors: number[]
  emit: (state: ResourcesState) => void
}

const validator = Joi.object<FindResourcesStateLiveParams>()
  .keys({
    resources: Joi.array().items(Joi.string().trim()).min(1).required(),
    collectors: Joi.array().items(Joi.number()).default([])
  })
  .unknown(true)

export class FindResourcesStateLive {
  private state: ResourcesState

  async initialize(params: FindResourcesStateLiveParams) {
    // Validate search parameters
    const { emit } = params
    const validatedParams = this.validate(params)

    // Find resources initial state
    const service = new FindResourcesState()
    this.state = await service.execute({
      resources: validatedParams.resources,
      collectors: validatedParams.collectors
    })

    // Emit initial state and connect to the web service
    emit(this.state)
  }

  private validate(params: FindResourcesStateLiveParams): FindResourcesStateLiveParams {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (errors.length) {
      throw new AppError('One or more properties are not valid.', { data: errors })
    }

    return value
  }

  dispose() {
    // TODO: Disconnect from the WS
  }
}
