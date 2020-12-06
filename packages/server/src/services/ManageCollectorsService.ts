import axios from 'axios'

import positionStackConfig from '@config/positionStack'
import Collector, { ICollector, ILocation } from '@entities/Collector'
import { IRouter } from '@entities/Router'

interface RRC {
  id: number
  name: string
  geographical_location: string
  topological_location: string
  activated_on: string
  deactivated_on: string
  peers: { asn: number; ip: string }[]
}

interface Location {
  latitude: number
  longitude: number
}

export default class ManageCollectorsService {
  async execute() {
    // 1. Load collectors from database
    const collectors = await Collector.find()

    // 2. Find collectors using RIS API
    const risCollectors = await this.findRISCollectors()

    // 3. Separate collectors between active and inactive
    const active = risCollectors.filter(rcc => !rcc.deactivated_on)
    const inactive = risCollectors.filter(rrc => !!rrc.deactivated_on)

    // 4. Remove inactive collectors from database, in case there's any
    await this.removeInactiveCollectors(inactive)

    // 5. Store each found collector from RIS
    for (const rrc of active) {
      const existingCollector = collectors.find(({ _id }) => _id === rrc.id)
      await this.storeCollector(rrc, existingCollector)
    }
  }

  private async findRISCollectors(): Promise<RRC[]> {
    const response = await axios.get<{ data: { rrcs: RRC[] } }>(
      'https://stat.ripe.net/data/rrc-info/data.json'
    )

    return response.data.data.rrcs
  }

  private async removeInactiveCollectors(inactive: RRC[]) {
    const inactiveIds = inactive.map(rrc => rrc.id)
    await Collector.deleteMany({ _id: { $in: inactiveIds } })
  }

  private async storeCollector(rrc: RRC, existingCollector: ICollector) {
    // 1. Find RRC location in case collector doesn't exist or location changed
    let location = existingCollector?.location
    if (!location || location.geographical !== rrc.geographical_location) {
      location = await this.findCollectorLocation(rrc)
    }

    // 2. Map collector peer to routers
    const routers = rrc.peers as IRouter[]

    // 3. Create collector
    const collector = {
      _id: rrc.id,
      name: rrc.name,
      location: location,
      routers: routers
    }

    // 4. Finally, store collector in the database
    if (existingCollector) {
      await Collector.updateOne({ _id: rrc.id }, { $set: collector })
    } else {
      await Collector.create(collector)
    }
  }

  private async findCollectorLocation(rrc: RRC): Promise<ILocation> {
    const url = `${positionStackConfig.url}/v1/forward`
    const response = await axios.get<{ data: Location[] }>(url, {
      params: {
        access_key: positionStackConfig.key,
        query: rrc.geographical_location,
        limit: 1
      }
    })

    const [foundLocation] = response.data.data
    return {
      geographical: rrc.geographical_location,
      topological: rrc.topological_location,
      latitude: foundLocation.latitude,
      longitude: foundLocation.longitude
    }
  }
}
