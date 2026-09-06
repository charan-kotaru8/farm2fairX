import React from 'react';

export default function BuyerDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Verification Status</h2>
          <p className="text-muted-foreground text-sm">Submit your documents to become a verified buyer.</p>
        </div>
        <span className="px-3 py-1 bg-warning/20 text-warning-foreground rounded-full text-sm font-medium border border-warning/30">
          Pending Verification
        </span>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border min-h-[300px] flex items-center justify-center flex-col text-muted-foreground">
        <div className="text-4xl mb-4">🛒</div>
        <h3 className="text-lg font-medium mb-1">Marketplace (Coming Phase 3)</h3>
        <p className="text-sm">Browse and bid on farmer crop lots.</p>
      </div>
    </div>
  );
}
