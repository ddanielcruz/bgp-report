import api from './api'

import './services/FindResourcesState'

const port = process.env.PORT || 3000

api.listen(port, () => {
  console.log(`Successfully started server on port \x1b[32m${port}\x1b[0m`)
})
