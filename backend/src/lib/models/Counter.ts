import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  _id: string;
  sequence: number;
  updatedAt?: Date;
  createdAt?: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, default: 0, required: true },
  },
  { timestamps: true, _id: false }
);

export const CounterModel: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);
