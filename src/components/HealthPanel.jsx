import { useEffect, useState } from "react";
import { getHealth } from "../lib/api.js";

export default function HealthPanel(){
  const [rows, setRows] = useState([]);
  
  useEffect(() => { 
    (async () => { 
      try { 
        const data = await getHealth();
        setRows(Array.isArray(data?.health) ? data.health : []);
      } catch(e) { 
        console.error("Failed to load health data:", e);
        setRows([]);
      }
    })(); 
  }, []);

  if(!rows || rows.length === 0) return null;
  
  return (
    <div className="border rounded p-3 bg-white mb-6">
      <div className="font-semibold mb-2">System Health (last 20)</div>
      <ul className="text-sm space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className={r.ok ? "text-green-600" : "text-red-600"}>
              {r.ok ? "OK" : "ERR"}
            </span>
            <span className="text-gray-700">{r.action}</span>
            <span className="text-gray-400">
              {new Date(r.ts || Date.now()).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
