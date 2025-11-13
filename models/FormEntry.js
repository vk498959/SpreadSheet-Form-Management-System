import mongoose from "mongoose";

const FormEntrySchema = new mongoose.Schema(
  {
    sheetName: { type: String, required: true }, // link to the sheet
    data: { type: Object, required: true }, // store row as { key: value }
  },
  { timestamps: true }
);

export default mongoose.models.FormEntry || mongoose.model("FormEntry", FormEntrySchema);
