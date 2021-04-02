import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import WebSocket from 'ws'

import { IResourcesRoute, ResourcesState } from '@core/database/entities'
import { hasDuplicates, removeDuplicates } from '@core/helpers'

dayjs.extend(utc)

interface SimplifiedResourcesState {
  id: string
  resources: string[]
  collectors: number[]
  peers: number[]
  routes: IResourcesRoute[]
  queriedAt: number
}

interface WebSocketsMap {
  [key: string]: WebSocket
}

interface WebSocketMessage {
  data: {
    peer: string
    peer_asn: string
    host: string
    type: string
    path?: number[]
    community?: [number, number][]
    withdrawals?: string[]
  }
}

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
      queriedAt: state.queriedAt,
      peers: state.routes.map(route => route.peer),
      routes: state.routes
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
    const client = `${process.env.RIS_CLIENT}-${Date.now()}`
    const socket = new WebSocket(`wss://ris-live.ripe.net/v1/ws/?client=${client}`)
    const params = {
      prefix: resource,
      moreSpecific: true,
      socketOptions: {
        includeRaw: true
      }
    }

    socket.onmessage = (event: any) => {
      const message: WebSocketMessage = JSON.parse(event.data)

      if (message.data.type === 'UPDATE') {
        this.onUpdateMessage(resource, message)
      }
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

  // 1.0 [x] Create a single instance of the service, return it if it was already created
  // 2.0 [x] Load every resources state newer than eight hours with live flag set to true
  // 3.0 [x] Create a websocket for each resource without collector filter
  // 4.0 [x] After each UPDATE message find states to update
  // 5.0 [x] Filter states by resource and collector if any
  // 6.0 [x] Remove the path in case of WITHDRAW
  // 7.0 [x] Create/Update the path in case of UPDATE (need to verify how)
  // 8.0 [ ] From ten to ten minutes verify if state is still newer than eight hours
  // 8.1 [ ] If it's not, close the websocket and set the live flag false
  // 9.0 [ ] Store in the database every change involving the state
  private onUpdateMessage(resource: string, { data }: WebSocketMessage) {
    // 1. Find states including the resource, also filtering by collector if any
    const collector = parseInt(data.host.replace('rrc', ''))
    const states = this.states.filter(({ resources, collectors }) => {
      return resources.includes(resource) && (!collectors.length || collectors.includes(collector))
    })

    // 2. Parse received route into database format
    const peer = parseInt(data.peer_asn)
    const path = data.path?.filter(router => !Array.isArray(router))
    const route: IResourcesRoute = {
      collector,
      path,
      peer,
      prepend: hasDuplicates(path),
      community: data.community?.map(comm => `${comm[0]}:${comm[1]}`) ?? [],
      source: data.peer
    }

    // 3. Loop through states updating their routing information
    for (const state of states) {
      const updatedState = { ...state }

      // 3.1 If peer is not part of the state and it has a path, add it to the state
      if (!state.peers.includes(peer) && path?.length) {
        updatedState.peers.push(peer)
        updatedState.routes.push(route)
      } else if (state.peers.includes(peer)) {
        // 3.2 If peer is part of the state and it has a path, update existing route
        if (path?.length) {
          updatedState.routes = state.routes.map(existingRoute => {
            return existingRoute.peer === peer ? route : existingRoute
          })
        }
        // 3.3 Otherwise, if peer is part of the state and it doesn't have a path (withdraw), remove the existing route
        else {
          updatedState.peers = updatedState.peers.filter(value => value !== peer)
          updatedState.routes = updatedState.routes.filter(route => route.peer !== peer)
        }
      }

      // TODO: 3.4 Store updated state
      // TODO: 3.5 Update state in the memory (states array)
    }
  }
}
