import { Server, Socket } from 'socket.io'

export const configure = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    /**
     * 1. Initialize service
     * 2. Try to connect using received parameters (find initial resources state)
     * 3. In case of success, send it to the client and connect to the WS
     * 4. Otherwise, send the error to the client and close the connection
     */
    console.log(`Connecting: ${socket.id}`)

    socket.on('disconnecting', () => {
      console.log(`Disconnecting: ${socket.id}`)
    })
  })
}
