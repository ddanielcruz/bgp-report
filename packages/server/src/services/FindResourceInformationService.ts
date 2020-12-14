import axios from 'axios'

interface Params {
  resource: string
}

interface BGPState {
  resource: string
  nr_routes: number
  bgp_state: {
    target_prefix: string
    source_id: string
    path: number[]
    community: string[]
  }[]
}

interface Resource {
  resource: string
  routes: {
    source: string
    collector: number
    path: number[]
  }[]
}

export default class FindResourceInformationService {
  async execute(params: Params): Promise<Resource> {
    // 1.0 Find resource state using RIS API
    const bgpState = await this.findResourceState(params)

    // 2.0 Parse BGP state into information
    return this.parseBGPStateInformation(bgpState)
  }

  private async findResourceState(params: Params): Promise<BGPState> {
    const { resource } = params
    const response = await axios.get<{ data: BGPState }>(
      `https://stat.ripe.net/data//bgp-state/data.json?resource=${resource}`
    )

    return response.data.data
  }

  private parseBGPStateInformation(bgpState: BGPState): Resource {
    return {
      resource: bgpState.resource,
      routes: bgpState.bgp_state.map(route => {
        const [collector, source] = route.source_id.split('-')
        return {
          source: source,
          collector: parseInt(collector),
          path: route.path
        }
      })
    }
  }
}
