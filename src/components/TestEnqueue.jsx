import React, { useState } from "react";
import { enqueue, enqueueJobs } from "@/lib/enqueue";

export default function TestEnqueue() {
  const [status, setStatus] = useState("");

  const sendSingle = async () => {
    setStatus("Queueing single job…");
    try {
      const result = await enqueue({
        id: `test-${Date.now()}`,
        action: "log_directory",
        payload: { Portal: "Sample Portal", URL: "https://example.com", Username: "test", Status: "Started" }
      });
      setStatus("OK (single): " + JSON.stringify(result));
    } catch (e) {
      setStatus("ERR (single): " + e.message);
    }
  };

  const sendBatch = async () => {
    setStatus("Queueing batch…");
    try {
      const result = await enqueueJobs([
        { id: `t1-${Date.now()}`, action: "log_directory", payload: { Portal: "A", URL: "https://a.com", Username: "u", Status: "Started" } },
        { id: `t2-${Date.now()}`, action: "log_directory", payload: { Portal: "B", URL: "https://b.com", Username: "u", Status: "Started" } }
      ]);
      setStatus("OK (batch): " + JSON.stringify(result));
    } catch (e) {
      setStatus("ERR (batch): " + e.message);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Test Enqueue</h2>
      <div className="flex gap-2">
        <button onClick={sendSingle} className="px-3 py-2 rounded bg-black text-white">Send single</button>
        <button onClick={sendBatch} className="px-3 py-2 rounded border">Send batch</button>
      </div>
      <pre className="text-xs bg-gray-50 p-2 rounded">{status}</pre>
    </div>
  );
}