import mongoose, { Schema, Document } from 'mongoose'

import Router, { IRouter } from './Router'

export interface IRRC extends Document {
  _id: number
  name: string
  location: {
    topological: string
    geographical: string
    latitude: number
    longitude: number
  }
  routers: IRouter[]
}

const RRCSchema = new Schema({
  _id: Number,
  name: {
    type: String,
    unique: true,
    trim: true
  },
  location: {
    topological: {
      type: String,
      required: true
    },
    geographical: {
      type: String,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  routers: [Router]
})

export default mongoose.model<IRRC>('RRC', RRCSchema)
