import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { gasGet } from "../lib/api";
import { enqueue } from "../lib/enqueue";

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
      // 1) Tell Manus watcher to write cadence.json
      const job = {
        id: `setcad-${Date.now()}`,
        action: "set_cadence",
        payload: { days, time, tz }
      };
      await enqueue(job);

      // 2) (Optional) ask Apps Script to rebuild its triggers from Drive
      const res = await gasGet("rebuildCadence"); // returns { ok:true, rebuilt:true, cfg }
      if (res?.ok) toast.success("Cadence applied & Apps Script triggers rebuilt.");
      else toast.warn("Cadence applied. Trigger rebuild returned a warning.");
    } catch (e) {
      console.error(e);
      toast.error(`Failed to apply cadence: ${e.message}`);
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
