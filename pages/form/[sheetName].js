import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function FormPage() {
  const router = useRouter();
  const { sheetName } = router.query;

  const [headers, setHeaders] = useState([]);
  const [fieldSettings, setFieldSettings] = useState({});
  const [formData, setFormData] = useState({});
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sheetName) return;
    (async () => {
      setLoading(true);
      try {
        const sheetRes = await axios.get(`/api/sheet?name=${sheetName}`);
        setHeaders(sheetRes.data.headers || []);
        const entryRes = await axios.get(`/api/form-entry?sheetName=${sheetName}`);
        setEntries(entryRes.data || []);

        const saved = localStorage.getItem(`formSettings_${sheetName}`);
        if (saved) setFieldSettings(JSON.parse(saved));
      } catch (err) {
        console.error(err);
        alert("Failed to load form data");
      } finally {
        setLoading(false);
      }
    })();
  }, [sheetName]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missing = headers.filter(
      (h) => fieldSettings[h]?.required && !formData[h]?.trim()
    );
    if (missing.length) {
      alert(`⚠️ Please fill required fields: ${missing.join(", ")}`);
      return;
    }

    try {
      await axios.post("/api/form-entry", { sheetName, data: formData });
      alert("✅ Form entry saved!");
      setFormData({});
      const res = await axios.get(`/api/form-entry?sheetName=${sheetName}`);
      setEntries(res.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save entry");
    }
  };

  if (loading) return <p>Loading form...</p>;
  if (!headers.length) return <p>No headers found for "{sheetName}".</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📋 Fill Form: {sheetName}</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
          marginBottom: "30px",
        }}
      >
        {headers.map((field) => {
          const setting = fieldSettings[field] || { type: "text" };

          if (setting.type === "textarea") {
            return (
              <div key={field}>
                <label style={{ fontWeight: "bold" }}>
                  {field} {setting.required && <span style={{ color: "red" }}>*</span>}
                </label>
                <textarea
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "6px" }}
                  required={setting.required}
                />
              </div>
            );
          }

          if (setting.type === "dropdown") {
            const options = (setting.options || "")
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean);
            return (
              <div key={field}>
                <label style={{ fontWeight: "bold" }}>
                  {field} {setting.required && <span style={{ color: "red" }}>*</span>}
                </label>
                <select
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  style={{ padding: "6px" }}
                  required={setting.required}
                >
                  <option value="">Select...</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (setting.type === "date") {
            return (
              <div key={field}>
                <label style={{ fontWeight: "bold" }}>
                  {field} {setting.required && <span style={{ color: "red" }}>*</span>}
                </label>
                <input
                  type="date"
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  required={setting.required}
                  style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
            );
          }

          // Default text/number
          return (
            <div key={field}>
              <label style={{ fontWeight: "bold" }}>
                {field} {setting.required && <span style={{ color: "red" }}>*</span>}
              </label>
              <input
                type={setting.type}
                value={formData[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                required={setting.required}
                style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          );
        })}

        <button
          type="submit"
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "8px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ➕ Submit Entry
        </button>
      </form>

      {/* Entries List */}
      <h2>📑 Existing Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry._id}>
                {headers.map((h) => (
                  <td key={h}>{entry.data[h]}</td>
                ))}
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
