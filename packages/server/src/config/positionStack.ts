interface PositionStackConfig {
  key: string
  url: string
}

export default {
  key: process.env.POSITION_STACK_KEY,
  url: process.env.POSITION_STACK_URL
} as PositionStackConfig
