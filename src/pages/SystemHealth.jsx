import { useEffect, useState } from "react";
import { gasGet } from "../lib/api";

export default function SystemHealth() {
  const [rows, setRows] = useState([]);

  useEffect(()=>{
    (async ()=>{
      try {
        const data = await gasGet("getProcessed"); // returns array
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        setRows(arr.slice(-20).reverse());
      } catch (e) {
        console.error(e);
      }
    })();
  },[]);

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">System Health</h1>
      <div className="text-sm text-gray-600">Showing latest 20 events from Manus watcher.</div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">OK</th>
              <th className="px-3 py-2 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.ts || ""}</td>
                <td className="px-3 py-2">{r.id || ""}</td>
                <td className="px-3 py-2">{r.action || ""}</td>
                <td className="px-3 py-2">{String(r.ok)}</td>
                <td className="px-3 py-2 text-red-600">{r.error || ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
