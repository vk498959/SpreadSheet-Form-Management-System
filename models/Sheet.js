import mongoose from "mongoose";

const SheetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // ensures no duplicate sheet names
    },
    data: {
      type: [[String]],
      default: [["", "", ""], ["", "", ""]],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Sheet || mongoose.model("Sheet", SheetSchema);
