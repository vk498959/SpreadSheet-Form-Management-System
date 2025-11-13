import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function Home() {
  const [sheetName, setSheetName] = useState("Sheet1");
  const [grid, setGrid] = useState([[""]]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load Sheet (fetches headers + rows separately)
  const loadSheet = async () => {
    if (!sheetName.trim()) return alert("Enter a sheet name");
    setLoading(true);
    try {
      const res = await axios.get(`/api/sheet?name=${encodeURIComponent(sheetName)}`);

      const { headers = [], entries = [] } = res.data;

      if (!headers.length) {
        // no existing sheet
        setGrid([[""]]);
      } else if (entries.length) {
        // reconstruct grid (first row headers + rest rows as values)
        const dataRows = entries.map((e) => headers.map((h) => e.data[h] || ""));
        setGrid([headers, ...dataRows]);
      } else {
        // sheet exists but empty
        setGrid([headers]);
      }
      setHeaders(headers);
    } catch (err) {
      console.error(err);
      alert("Failed to load sheet");
      setGrid([[""]]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (r, c, value) => {
    const newGrid = grid.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? value : cell))
    );
    setGrid(newGrid);
  };

  const addRow = () => setGrid([...grid, new Array(grid[0]?.length || 1).fill("")]);
  const addColumn = () => setGrid(grid.map((row) => [...row, ""]));
  const deleteRow = (index) => setGrid(grid.filter((_, i) => i !== index));
  const deleteColumn = (index) => setGrid(grid.map((row) => row.filter((_, i) => i !== index)));

  const saveSheet = async () => {
    if (!sheetName.trim()) return alert("Enter a sheet name");
    if (grid.length < 1) return alert("Grid is empty!");

    try {
      await axios.post("/api/sheet", { name: sheetName, data: grid });
      alert(`✅ Saved sheet "${sheetName}"!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save sheet");
    }
  };

  const exportToExcel = async () => {
    if (!sheetName.trim()) return alert("Enter a sheet name");
    try {
      const response = await axios.get(
        `/api/sheet?name=${encodeURIComponent(sheetName)}&export=true`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${sheetName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel");
    }
  };

  // ✅ Import Excel file and set grid
  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setGrid(jsonData.length ? jsonData : [[""]]);
      if (jsonData.length > 0) setHeaders(jsonData[0]);
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Spreadsheet → Form Data</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>Sheet Name: </label>
        <input
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          style={{ width: "150px" }}
        />
        <button onClick={loadSheet} style={{ marginLeft: "10px" }}>
          🔄 Load Sheet
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={importFromExcel}
          style={{ marginLeft: "10px" }}
        />
      </div>

      <table
        border="1"
        cellPadding="4"
        style={{
          borderCollapse: "collapse",
          marginTop: "20px",
          background: "#fafafa",
        }}
      >
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <input
                    value={cell}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    style={{
                      width: "120px",
                      border: "none",
                      outline: "none",
                      textAlign: "center",
                      background: r === 0 ? "#e3f2fd" : "transparent",
                      fontWeight: r === 0 ? "bold" : "normal",
                    }}
                  />
                </td>
              ))}
              {r !== 0 && (
                <td>
                  <button
                    onClick={() => deleteRow(r)}
                    style={{
                      background: "#ffcccc",
                      border: "1px solid #ff8888",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Row
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>

        {grid.length > 0 && (
          <tfoot>
            <tr>
              {grid[0]?.map((_, c) => (
                <td key={c}>
                  <button
                    onClick={() => deleteColumn(c)}
                    style={{
                      background: "#ffcccc",
                      border: "1px solid #ff8888",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    🗑️ Col
                  </button>
                </td>
              ))}
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>

      <div style={{ marginTop: "10px" }}>
        <button onClick={addRow}>➕ Add Row</button>
        <button onClick={addColumn}>➕ Add Column</button>
        <button onClick={saveSheet}>💾 Save</button>
        <button onClick={exportToExcel}>📤 Export Excel</button>
      </div>
    </div>
  );
}
