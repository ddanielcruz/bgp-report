interface RISLiveConfig {
  client: string
}

export default {
  client: process.env.RIS_CLIENT
} as RISLiveConfig
