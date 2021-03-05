export class FindResourcesStateLive {
  async execute() {
    /**
     * 1. Receive and validate search parameters (resources and collectors, maybe communities)
     * 2. Try to find resources initial state
     * 3. In case of success send it to the client and connect to the WS
     * 4. Otherwise throw an error with failure reason
     */
  }

  dispose() {
    // TODO: Disconnect from the WS
  }
}
