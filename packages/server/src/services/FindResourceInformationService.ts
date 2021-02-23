import axios from 'axios'

import * as views from '../views/resources.views'

interface Params {
  resources?: string
  collectors?: string
  timestamp?: string
  communities?: string
}

export interface BGPState {
  resource: string | string[]
  nr_routes: number
  bgp_state: {
    target_prefix: string
    source_id: string
    path: number[]
    community: string[]
  }[]
}

export interface Route {
  source: string
  collector: number
  peer: number
  path: number[]
  community: string[]
}

export interface Resource {
  resources: string[]
  routes: Route[]
  prepends: Route[]
  timestamp: number
}

export default class FindResourceInformationService {
  async execute(params: Params): Promise<Resource> {
    // 1.0 Find resource state using RIS API
    const timestamp = new Date()
    const bgpState = await this.findResourceState(params)

    // 2.0 Filter by communities in case received any
    const { communities = '' } = params
    if (communities) {
      const separatedComm = communities.split(',').map(value => value.trim())

      bgpState.bgp_state = bgpState.bgp_state.filter(route => {
        return route.community.some(comm => separatedComm.includes(comm))
      })
    }

    // 3.0 Parse BGP state into information
    return views.render(bgpState, timestamp)
  }

  private async findResourceState(params: Params): Promise<BGPState> {
    const { resources } = params
    const response = await axios.get<{ data: BGPState }>(
      'https://stat.ripe.net/data//bgp-state/data.json',
      {
        params: {
          resource: resources,
          rrcs: params.collectors ?? undefined,
          timestamp: params.timestamp ?? undefined
        }
      }
    )

    return response.data.data
  }
}
