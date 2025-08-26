import React from 'react';

const FlowGuides = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Status section guides */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-200" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200" />
      
      {/* Agency filter guides */}
      <div className="absolute top-0 left-0 h-full w-1 bg-gray-200" />
      <div className="absolute top-0 right-0 h-full w-1 bg-gray-200" />
      
      {/* Urgency guides */}
      <div className="absolute top-0 left-1/4 h-full w-1 bg-gray-200" />
      <div className="absolute top-0 left-1/2 h-full w-1 bg-gray-200" />
      <div className="absolute top-0 left-3/4 h-full w-1 bg-gray-200" />
    </div>
  );
};

export default FlowGuides;
