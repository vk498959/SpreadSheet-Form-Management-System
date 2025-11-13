import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function FormDesignPage() {
  const router = useRouter();
  const { sheetName } = router.query;

  const [headers, setHeaders] = useState([]);
  const [fieldSettings, setFieldSettings] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch headers from the Sheet model
  useEffect(() => {
    if (!sheetName) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/sheet?name=${sheetName}`);
        setHeaders(res.data.headers || []);
        const saved = localStorage.getItem(`formSettings_${sheetName}`);
        if (saved) setFieldSettings(JSON.parse(saved));
      } catch (err) {
        console.error(err);
        alert("Failed to load sheet headers");
      } finally {
        setLoading(false);
      }
    })();
  }, [sheetName]);

  const handleFieldSettingChange = (field, key, value) => {
    setFieldSettings((prev) => ({
      ...prev,
      [field]: { ...prev[field], [key]: value },
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(`formSettings_${sheetName}`, JSON.stringify(fieldSettings));
    alert("✅ Form design saved!");
  };

  if (loading) return <p>Loading design editor...</p>;
  if (!headers.length) return <p>No headers found for "{sheetName}".</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛠️ Design Form for: {sheetName}</h1>
      <p style={{ color: "#666" }}>
        Choose field types, dropdown options, and mark required fields.
      </p>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "12px",
          borderRadius: "6px",
          background: "#fafafa",
        }}
      >
        {headers.map((h) => (
          <div
            key={h}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <strong style={{ width: "120px" }}>{h}</strong>

            {/* Type Selector */}
            <select
              value={fieldSettings[h]?.type || "text"}
              onChange={(e) => handleFieldSettingChange(h, "type", e.target.value)}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="textarea">Textarea</option>
              <option value="dropdown">Dropdown</option>
              <option value="date">Date</option>
            </select>

            {/* Dropdown options */}
            {fieldSettings[h]?.type === "dropdown" && (
              <input
                type="text"
                placeholder="Comma-separated options (e.g. HR,IT,Finance)"
                value={fieldSettings[h]?.options || ""}
                onChange={(e) => handleFieldSettingChange(h, "options", e.target.value)}
                style={{ width: "250px" }}
              />
            )}

            {/* Required checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="checkbox"
                checked={!!fieldSettings[h]?.required}
                onChange={(e) =>
                  handleFieldSettingChange(h, "required", e.target.checked)
                }
              />
              Required
            </label>
          </div>
        ))}

        <button
          onClick={saveSettings}
          style={{
            marginTop: "12px",
            padding: "6px 14px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          💾 Save Design
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => router.push(`/form/${sheetName}`)}
          style={{
            padding: "6px 14px",
            background: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ➡️ Go to Form
        </button>
      </div>
    </div>
  );
}
