import { useState } from "react";
import { Sparkles, Globe, Info, AlertTriangle } from "lucide-react";
import { geminiService } from "../services/geminiService";

const LOCAL_RERA_REGISTRY = {
  "maharashtra_p52100009876": {
    projectName: "Kolte Patil Life Republic Sector R10",
    promoter: "Kolte-Patil Developers Ltd",
    completionDate: "2023-03-31",
    status: "Severely Delayed",
    locality: "Marunji, Pune, Maharashtra",
    builtArea: "850,000 sq ft",
    warnings: "Possession deadline missed. Show-cause notice issued by MahaRERA under Section 7 for slow progress.",
  },
  "karnataka_prm/ka/rera/1251/310/pr/201015/003820": {
    projectName: "Prestige Lakeside Habitat Phase 2",
    promoter: "Prestige Group Developers",
    completionDate: "2024-12-31",
    status: "Delayed",
    locality: "Varthur, Bengaluru, Karnataka",
    builtArea: "1,200,000 sq ft",
    warnings: "Extension granted twice due to environmental clearance delay. Current extension expired. Construction at 92%.",
  },
};

export default function ProjectFetchPanel({ onProjectLoaded }) {
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [searchRegNo, setSearchRegNo] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchRegNo.trim()) return;

    const queryKey = searchRegNo.trim().toLowerCase();
    const cacheKey = `rera_hub_cache_${selectedState.toLowerCase()}_${queryKey}`;
    const registryKey = `${selectedState.toLowerCase()}_${queryKey}`;

    setSearchLoading(true);
    setProjectDetails(null);

    const registeredMatch = LOCAL_RERA_REGISTRY[registryKey];
    if (registeredMatch) {
      setTimeout(() => {
        setProjectDetails(registeredMatch);
        onProjectLoaded?.(registeredMatch);
        setSearchLoading(false);
      }, 400);
      return;
    }

    const cachedMatch = localStorage.getItem(cacheKey);
    if (cachedMatch) {
      setTimeout(() => {
        try {
          const parsed = JSON.parse(cachedMatch);
          setProjectDetails(parsed);
          onProjectLoaded?.(parsed);
        } catch (err) {
          console.warn("RERA cache read failed:", err);
        }
        setSearchLoading(false);
      }, 400);
      return;
    }

    try {
      const details = await geminiService.fetchReraDetails(searchRegNo.trim(), selectedState);
      setProjectDetails(details);
      localStorage.setItem(cacheKey, JSON.stringify(details));
      onProjectLoaded?.(details);
    } catch (err) {
      alert(`RERA Registry lookup failed: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <section className="panel fetch-panel">
      <h3>Fetch RERA project details</h3>
      <p className="muted">Optional registry lookup — enable via VITE_ENABLE_RERA_PROJECT_FETCH.</p>
      <form onSubmit={handleSearch} className="fetch-form">
        <label>
          State
          <div className="select-wrap">
            <Globe size={14} />
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
              <option value="Maharashtra">Maharashtra (MahaRERA)</option>
              <option value="Karnataka">Karnataka (K-RERA)</option>
              <option value="Delhi">Delhi (Delhi RERA)</option>
              <option value="Uttar Pradesh">Uttar Pradesh (UP-RERA)</option>
              <option value="Haryana">Haryana (HRERA)</option>
              <option value="Gujarat">Gujarat (GujRERA)</option>
            </select>
          </div>
        </label>
        <label>
          RERA registration number
          <input
            type="text"
            value={searchRegNo}
            onChange={(e) => setSearchRegNo(e.target.value)}
            placeholder="e.g. P52100009876"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={searchLoading || !searchRegNo.trim()}>
          <Sparkles size={14} />
          {searchLoading ? "Querying registry…" : "Fetch RERA records"}
        </button>
      </form>

      {projectDetails && (
        <div className="audit-box">
          <strong><Info size={12} /> Project audit</strong>
          <div><b>Project:</b> {projectDetails.projectName}</div>
          <div><b>Promoter:</b> {projectDetails.promoter}</div>
          <div><b>Completion:</b> {projectDetails.completionDate}</div>
          <div>
            <b>Status:</b>{" "}
            <span className={`badge ${projectDetails.status?.includes("Delay") ? "badge-warning" : "badge-success"}`}>
              {projectDetails.status || "Audited"}
            </span>
          </div>
          {projectDetails.warnings && (
            <div className="warn-box">
              <AlertTriangle size={12} />
              <span>{projectDetails.warnings}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
