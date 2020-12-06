import { Schema } from 'mongoose'

export interface IRouter {
  asn: number
  ip: string
}

const RouterSchema = new Schema(
  {
    asn: {
      type: Number,
      required: true
    },
    ip: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
)

export default RouterSchema
