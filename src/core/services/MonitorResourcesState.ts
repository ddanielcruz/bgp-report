import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import WebSocket from 'ws'

import config from '@config/risLive'
import { ResourcesState } from '@core/database/entities'
import { removeDuplicates } from '@core/helpers'

dayjs.extend(utc)

interface SimplifiedResourcesState {
  id: string
  resources: string[]
  collectors: number[]
  queriedAt: number
}

interface WebSocketsMap {
  [key: string]: WebSocket
}

// 1.0 Create a single instance of the service, return it if it was already created
// 2.0 Load every resources state newer than eight hours with live flag set to true
// 3.0 Create a websocket for each resource without collector filter
// 4.0 After each message (UPDATE or WITHDRAW) find states to update
// 5.0 Filter states by resource and collector if any
// 6.0 Remove the path in case of WITHDRAW
// 7.0 Create/Update the path in case of UPDATE (need to verify how)
// 8.0 From ten to ten minutes verify if state is still newer than eight hours
// 8.1 If it's not, close the websocket and set the live flag false
// 9.0 Store in the database every change involving the state
export class MonitorResourcesState {
  private static monitor: MonitorResourcesState
  private states: SimplifiedResourcesState[] = []
  private resources: string[] = []
  private sockets: WebSocketsMap = {}

  constructor() {
    this.initialize()
  }

  static create(): MonitorResourcesState {
    return this.monitor || (this.monitor = new MonitorResourcesState())
  }

  private async initialize() {
    // 1. Load resources newer than eight hours with live flag set to true
    const minQueriedAt = dayjs.utc().add(-8, 'hours').toDate().getTime()
    const liveStates = await ResourcesState.find({ live: true, queriedAt: { $gt: minQueriedAt } })
    this.states = liveStates.map(state => ({
      id: state._id,
      resources: state.resources,
      collectors: state.collectors,
      queriedAt: state.queriedAt
    }))

    // 2. Map each of the existing resources
    this.states.forEach(state => this.resources.push(...state.resources))
    this.resources = removeDuplicates(this.resources)

    // 3. Open a websocket for each resource
    for (const resource of this.resources) {
      this.sockets[resource] = this.createWebSocket(resource)
    }
  }

  private createWebSocket(resource: string): WebSocket {
    const socket = new WebSocket(`wss://ris-live.ripe.net/v1/ws/?client=${config.client}`)
    const params = { prefix: resource, moreSpecific: true }

    socket.onmessage = () => {
      // TODO: Handle message
    }

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'ris_subscribe',
          data: params
        })
      )
    }

    return socket
  }
}
