import mongoose from 'mongoose'

const config = {
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT,
  authSource: process.env.MONGO_AUTH || 'admin',
  username: process.env.MONGO_USER,
  password: process.env.MONGO_PASS,
  database: process.env.MONGO_DB
}

const port = config.port ? `:${config.port}` : ''
const prefix = port ? 'mongodb' : 'mongodb+srv'

mongoose.connect(
  `${prefix}://${config.username}:${config.password}@${config.host}${port}/${config.database}?authSource=${config.authSource}`,
  {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true
  }
)
