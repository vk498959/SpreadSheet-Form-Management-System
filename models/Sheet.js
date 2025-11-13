import mongoose from "mongoose";

const SheetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    headers: { type: [String], default: [] }, // the first row (keys)
  },
  { timestamps: true }
);

export default mongoose.models.Sheet || mongoose.model("Sheet", SheetSchema);
