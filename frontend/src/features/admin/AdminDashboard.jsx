import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Total Farmers', 'Verified Buyers', 'Active Lots', 'Traded Volume'].map(stat => (
          <div key={stat} className="bg-white p-4 rounded-xl shadow-sm border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">{stat}</div>
            <div className="text-2xl font-bold font-heading">0</div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border min-h-[300px] flex items-center justify-center flex-col text-muted-foreground">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium mb-1">Analytics (Coming Phase 7)</h3>
      </div>
    </div>
  );
}
