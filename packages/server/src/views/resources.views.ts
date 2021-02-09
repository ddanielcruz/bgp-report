import { hasDuplicates } from './../helpers/hasDuplicates'
import {
  BGPState,
  Resource,
  Route
} from './../services/FindResourceInformationService'

export const render = (bgpState: BGPState, timestamp: Date): Resource => {
  const routes: Route[] = []
  const prepends: Route[] = []
  const { resource, bgp_state } = bgpState

  bgp_state.forEach(rawRoute => {
    const [collector, source] = rawRoute.source_id.split('-')
    const route: Route = {
      source: source,
      collector: parseInt(collector),
      peer: rawRoute.path[0],
      path: rawRoute.path,
      community: rawRoute.community
    }

    routes.push(route)
    if (hasDuplicates(route.path)) {
      prepends.push(route)
    }
  })

  return {
    resources: typeof resource === 'string' ? [resource] : resource,
    routes,
    prepends,
    timestamp: timestamp.getTime()
  }
}
