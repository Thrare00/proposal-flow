import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { setCadence, getHealth } from "../lib/api";

const ALL_DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

export default function CadenceSettings() {
  const [days, setDays] = useState(["MON","WED"]);
  const [time, setTime] = useState("09:10");
  const [tz, setTz] = useState("America/New_York");
  const [busy, setBusy] = useState(false);

  useEffect(()=>{
    // optional: if you later expose an endpoint to read cadence.json via GAS,
    // you could load existing values here.
  }, []);

  const toggleDay = (d) => {
    setDays(prev => prev.includes(d) 
      ? prev.filter(x=>x!==d) 
      : [...prev, d].sort((a,b)=>ALL_DAYS.indexOf(a)-ALL_DAYS.indexOf(b)));
  };

  const applyCadence = async () => {
    setBusy(true);
    try {
      // Set the cadence using the new API function
      const response = await setCadence({ days, time, tz });
      
      if (response?.success) {
        // If we have a rebuild response, show appropriate message
        if (response.rebuilt) {
          toast.success("Cadence applied & Apps Script triggers rebuilt.");
        } else {
          toast.success("Cadence applied successfully.");
        }
        
        // Refresh health data to show updated status
        try {
          const health = await getHealth();
          if (health?.last_processed) {
            toast.info(`Last processed: ${new Date(health.last_processed.timestamp).toLocaleString()}`);
          }
        } catch (healthError) {
          console.warn('Could not refresh health status:', healthError);
        }
      } else {
        throw new Error(response?.error || 'Unknown error applying cadence');
      }
    } catch (e) {
      console.error('Cadence update failed:', e);
      toast.error(`Failed to apply cadence: ${e.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cadence Settings</h1>

      <div className="space-y-2">
        <div className="font-semibold">Days</div>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map(d => (
            <button
              key={d}
              type="button"
              onClick={()=>toggleDay(d)}
              className={`px-3 py-1 rounded border ${days.includes(d) ? "bg-black text-white" : "bg-white"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">Time (24h)</label>
        <input
          type="time"
          value={time}
          onChange={e=>setTime(e.target.value)}
          className="border rounded px-3 py-2 w-40"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">Timezone (IANA)</label>
        <input
          type="text"
          value={tz}
          onChange={e=>setTz(e.target.value)}
          placeholder="America/New_York"
          className="border rounded px-3 py-2 w-80"
        />
      </div>

      <button
        onClick={applyCadence}
        disabled={busy}
        className="px-4 py-2 rounded bg-black text-white"
      >
        {busy ? "Applying…" : "Apply Cadence"}
      </button>
    </div>
  );
}
