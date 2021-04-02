import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import WebSocket from 'ws'

import { IResourcesRoute, IResourcesState, ResourcesState } from '@core/database/entities'
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
  [key: string]: WebSocket | null
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

    // 4. Setup scheduler to close websockets
    const TEN_MINUTES = 600000
    setInterval(this.closeExpiredStates, TEN_MINUTES)
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

  private async onUpdateMessage(resource: string, { data }: WebSocketMessage) {
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

      // 3.4 Store updated state
      const prepends = updatedState.routes.filter(route => route.prepend).length
      await ResourcesState.findByIdAndUpdate(updatedState.id, {
        $set: {
          prepends,
          routes: updatedState.routes
        }
      })

      // 3.5 Update state in the memory (states array)
      this.states = this.states.map(memoryState => {
        return memoryState.id === updatedState.id ? updatedState : memoryState
      })
    }
  }

  private closeExpiredStates = async () => {
    // 1. Find states queried before eight hours ago
    const minQueriedAt = dayjs.utc().add(-8, 'hours').toDate().getTime()
    const expiredStates = this.states.filter(state => state.queriedAt <= minQueriedAt)

    if (expiredStates.length) {
      // 2. Remove expired states from states array
      this.states = this.states.filter(state => state.queriedAt > minQueriedAt)

      // 3. Map existing resources again
      let resources = []
      this.states.forEach(state => resources.push(...state.resources))
      this.resources = removeDuplicates(resources)

      // 4. Close resources from expired states when necessary
      resources = []
      expiredStates.forEach(state => resources.push(...state.resources))
      for (const resource of removeDuplicates(resources)) {
        if (!this.resources.includes(resource) && this.sockets[resource]) {
          this.sockets[resource].close()
          this.sockets[resource] = null
        }
      }

      // 5. Update each of the expired states in the database
      for (const state of expiredStates) {
        await ResourcesState.findByIdAndUpdate(state.id, { $set: { live: false } })
      }
    }
  }

  private async addState(rawState: IResourcesState) {
    // 1. Verify if state is not already being monitored
    const existingState = this.states.find(state => state.id === rawState.id)

    if (!existingState) {
      // 2. Add it to the states array
      this.states.push({
        id: rawState.id,
        collectors: rawState.collectors,
        peers: rawState.routes.map(route => route.peer),
        queriedAt: rawState.queriedAt,
        resources: rawState.resources,
        routes: rawState.routes
      })

      // 3. Open a websocket for each resource not included in the websockets map
      for (const resource of rawState.resources) {
        if (!this.resources.includes(resource)) {
          this.resources.push(resource)
          this.sockets[resource] = this.createWebSocket(resource)
        }
      }
    }
  }
}
