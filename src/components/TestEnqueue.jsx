import React, { useState } from "react";
import { enqueue } from "../lib/enqueue";

export default function TestEnqueue() {
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState("");

  const handleClick = async () => {
    setBusy(true);
    try {
      const job = {
        id: `ping-${Date.now()}`,
        action: "health_ping",
        payload: { note: "PF quick test" },
      };

      const res = await enqueue(job);
      setLastId(res?.id || job.id);

      // Clear, non-intrusive feedback instead of blocking alert
      console.log("✅ Job queued:", res);
    } catch (e) {
      console.error("❌ Failed to enqueue:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        title="Push a test job to the automation system"
      >
        {busy ? "Sending…" : "Push to Cloud"}
      </button>

      {lastId && (
        <p className="text-sm text-gray-600">
          ✅ Last Job ID: <span className="font-mono">{lastId}</span>
        </p>
      )}
    </div>
  );
}
