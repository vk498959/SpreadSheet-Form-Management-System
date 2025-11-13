import { connectDB } from "../../lib/mongodb";
import Sheet from "../../models/Sheet";
import FormEntry from "../../models/FormEntry";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  await connectDB();

  const sheetName = req.query.name || req.body.name;
  if (!sheetName) return res.status(400).json({ error: "Sheet name is required" });

  if (req.method === "GET") {
    try {
      const sheet = await Sheet.findOne({ name: sheetName });
      const entries = await FormEntry.find({ sheetName });

      if (req.query.export === "true") {
        if (!sheet) return res.status(404).json({ error: "Sheet not found" });

        const headers = sheet.headers || [];
        const aoa = [
          headers,
          ...entries.map((entry) => headers.map((h) => entry.data[h] || "")),
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        res.setHeader("Content-Disposition", `attachment; filename=${sheetName}.xlsx`);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return res.status(200).send(buffer);
      }

      res.status(200).json({
        name: sheetName,
        headers: sheet?.headers || [],
        entries,
      });
    } catch (error) {
      console.error("GET /api/sheet error:", error);
      res.status(500).json({ error: "Unable to fetch sheet" });
    }
  } else if (req.method === "POST") {
    try {
      const { data } = req.body; // Expect [["Name","Age"],["Alice",25],["Bob",30]]
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: "Invalid sheet data" });
      }

      const headers = data[0];
      const rows = data.slice(1);

      // Create or update Sheet metadata
      let sheet = await Sheet.findOne({ name: sheetName });
      if (!sheet) {
        sheet = await Sheet.create({ name: sheetName, headers });
      } else {
        sheet.headers = headers;
        await sheet.save();
      }

      // Remove existing entries for that sheet (optional, to replace data)
      await FormEntry.deleteMany({ sheetName });

      // Insert new entries
      const entries = rows.map((row) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = row[i] || ""));
        return { sheetName, data: obj };
      });

      await FormEntry.insertMany(entries);

      res.status(200).json({ message: "Sheet data stored successfully", count: entries.length });
    } catch (error) {
      console.error("POST /api/sheet error:", error);
      res.status(500).json({ error: "Unable to save sheet" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
