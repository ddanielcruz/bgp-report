import mongoose, { Schema, Document } from 'mongoose'

import { RouterSchema, IRouter } from './Router'

export interface ILocation {
  topological: string
  geographical: string
  countryCode: string
  latitude: number
  longitude: number
}

export interface ICollector extends Document {
  _id: number
  name: string
  location: ILocation
  routers: IRouter[]
}

const CollectorSchema = new Schema({
  _id: Number,
  name: {
    type: String,
    unique: true,
    trim: true
  },
  location: {
    topological: {
      type: String,
      trim: true
    },
    geographical: {
      type: String,
      required: true,
      trim: true
    },
    countryCode: {
      type: String,
      required: true,
      trim: true
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
  routers: [RouterSchema]
})

export const Collector = mongoose.model<ICollector>('Collector', CollectorSchema)
