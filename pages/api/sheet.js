import { connectDB } from "../../lib/mongodb";
import Sheet from "../../models/Sheet";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  await connectDB();

  const sheetName = req.query.name || req.body.name;
  if (!sheetName) return res.status(400).json({ error: "Sheet name is required" });

  if (req.method === "GET") {
    try {
      // Only fetch, do NOT create automatically
      const sheet = await Sheet.findOne({ name: sheetName });

      if (req.query.export === "true") {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sheet?.data || [[]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        res.setHeader("Content-Disposition", `attachment; filename=${sheetName}.xlsx`);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return res.status(200).send(buffer);
      }

      // Return sheet if exists, else return empty grid
      res.status(200).json(sheet || { name: sheetName, data: [[""]] });
    } catch (error) {
      console.error("GET /api/sheet error:", error);
      res.status(500).json({ error: "Unable to fetch sheet" });
    }
  } else if (req.method === "POST") {
    try {
      const { data } = req.body;
      let sheet = await Sheet.findOne({ name: sheetName });

      if (!sheet) {
        // Create sheet only on save
        sheet = await Sheet.create({ name: sheetName, data });
      } else {
        sheet.data = data;
        await sheet.save();
      }

      res.status(200).json(sheet);
    } catch (error) {
      console.error("POST /api/sheet error:", error);
      res.status(500).json({ error: "Unable to save sheet" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
