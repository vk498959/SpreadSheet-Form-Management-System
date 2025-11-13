import { connectDB } from "../../lib/mongodb";
import FormEntry from "../../models/FormEntry";
import Sheet from "../../models/Sheet";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    try {
      const { sheetName, data } = req.body;
      if (!sheetName) return res.status(400).json({ error: "Sheet name required" });
      if (!data || typeof data !== "object")
        return res.status(400).json({ error: "Invalid form data" });

      const sheet = await Sheet.findOne({ name: sheetName });
      if (!sheet) return res.status(404).json({ error: "Sheet not found" });

      const entry = await FormEntry.create({ sheetName, data });
      return res.status(201).json(entry);
    } catch (err) {
      console.error("POST /api/form-entry error:", err);
      res.status(500).json({ error: "Unable to save form entry" });
    }
  }

  if (req.method === "GET") {
    try {
      const { sheetName } = req.query;
      if (!sheetName) return res.status(400).json({ error: "Sheet name required" });

      const entries = await FormEntry.find({ sheetName }).sort({ createdAt: -1 }).limit(2);
      return res.status(200).json(entries);
    } catch (err) {
      console.error("GET /api/form-entry error:", err);
      res.status(500).json({ error: "Unable to fetch entries" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
