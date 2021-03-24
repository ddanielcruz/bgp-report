import { ICollector } from '@core/database/entities'

export const render = (collector: ICollector) => {
  return {
    id: collector._id,
    name: collector.name,
    location: collector.location,
    routers: collector.routers
  }
}

export const renderMany = (collectors: ICollector[]) => collectors.map(render)
