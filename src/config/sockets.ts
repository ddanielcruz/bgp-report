import { ParsedUrlQuery } from 'node:querystring'
import { Server, Socket } from 'socket.io'

import { FindResourcesStateLive } from '../services/FindResourcesStateLive'
import { ResourcesState } from './../services/FindResourcesState'

const parseParameters = (query: ParsedUrlQuery) => {
  const splitParameter = (value: string | string[]) => {
    return (Array.isArray(value) ? value[0].split(',') : value.split(',')).filter(Boolean)
  }

  return {
    resources: splitParameter(query.resources ?? ''),
    collectors: splitParameter(query.collectors ?? '')
  }
}

export const configure = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    // Create service
    console.log(`Connecting: ${socket.id}`)
    const service = new FindResourcesStateLive()

    // Setup disconnect event to dispose the websocket
    socket.on('disconnecting', () => {
      console.log(`Disconnecting: ${socket.id}`)
      service.dispose()
    })

    // Create function to emit resources state
    const emit = (state: ResourcesState) => {
      socket.emit('RESOURCES_STATE', state)
    }

    // Initialize websocket
    const params: any = parseParameters(socket.handshake.query)
    service.initialize({ ...params, emit }).catch(error => {
      // Emit connection failure in case of error
      console.log(error)
      socket.emit('CONNECTION_FAILURE', error)
      socket.disconnect()
    })
  })
}
