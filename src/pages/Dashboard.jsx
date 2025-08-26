import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/board" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Flow Board</h2>
          <p className="text-gray-600">View and manage your proposals</p>
        </Link>
        <Link to="/reminders" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Reminders</h2>
          <p className="text-gray-600">View upcoming deadlines</p>
        </Link>
        <Link to="/calendar" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="text-gray-600">View your schedule</p>
        </Link>
      </div>
    </div>
  );
}
