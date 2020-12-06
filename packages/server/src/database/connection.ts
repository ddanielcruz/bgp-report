import mongoose from 'mongoose'

const config = {
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT || '27017',
  authSource: process.env.MONGO_AUTH || 'admin',
  username: process.env.MONGO_USER,
  password: process.env.MONGO_PASS,
  database: process.env.MONGO_DB
}

mongoose.connect(
  `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=${config.authSource}`,
  {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true
  }
)
