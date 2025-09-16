import { useState } from 'react';
import TestEnqueue from './components/TestEnqueue.jsx';

export default function App() {
  const [showTestEnqueue, setShowTestEnqueue] = useState(false);

  // The RouterProvider is now handled in main.jsx
  return (
    <>
      {showTestEnqueue && (
        <div className="fixed bottom-4 right-4 z-50">
          <TestEnqueue />
        </div>
      )}
    </>
  );
}