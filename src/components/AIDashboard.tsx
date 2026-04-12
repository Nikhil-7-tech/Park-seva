import React, { useState, useEffect } from 'react';

const AIDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const now = new Date();
        const response = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hour: now.getHours(),
            day_type: now.getDay() === 0 || now.getDay() === 6 ? 1 : 0,
            special_day: 0 
          })
        });

        if (!response.ok) throw new Error("Backend connection failed");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("AI Server connected nahi hai. Please check app.py");
      }
    };
    fetchPrediction();
  }, []);

  if (error) return <div className="p-6 text-red-500 font-bold bg-red-50 rounded-lg border border-red-200 m-4">{error}</div>;
  if (!data) return <div className="p-10 text-center text-gray-400 animate-pulse text-lg font-medium">Analyzing Parking Patterns...</div>;

  const occupancy = data.occupancy_percent;
  let statusColor = "text-green-600";
  let barColor = "bg-green-500";

  if (occupancy > 80) {
    statusColor = "text-red-600";
    barColor = "bg-red-500";
  } else if (occupancy > 50) {
    statusColor = "text-amber-500";
    barColor = "bg-amber-500";
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-10 mt-6 mb-10 space-y-10">
      
      {/* Header Section with Feature Tagline */}
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">AI Insights & Owner Dashboard</h1>
        <p className="text-gray-500 font-medium italic">"Ready to experience parking that feels amazing?"</p>
      </div>

      {/* SECTION 1: Main Prediction Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-10 md:gap-16">
          
          <div className="flex-[1.5] w-full flex flex-col justify-center text-left">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Congestion Status</span>
            <h3 className={`text-6xl md:text-7xl font-black ${statusColor} tracking-tighter mb-4`}>
              {data.congestion_level} Risk
            </h3>
            <p className="text-lg text-gray-500 max-w-xl mb-8">
              The predicted occupancy is <span className="font-bold text-gray-800">{occupancy}%</span>.
            </p>

            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-3 shadow-inner">
               <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${occupancy}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
               <span>Live Capacity Level</span>
               <span className={statusColor}>{occupancy}% Full</span>
            </div>
          </div>

          {/* Efficiency Tip Box */}
          <div className="flex-1 min-w-[320px] bg-slate-50 p-8 md:p-10 rounded-[2rem] border-l-[8px] border-purple-500 relative overflow-hidden flex flex-col justify-center text-left">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl"></div>
            <span className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4 block relative">Efficiency Tip</span>
            <h4 className="text-xl font-bold text-slate-800 mb-6 relative italic">Best time for easy parking</h4>
            <div className="flex items-baseline gap-2 mb-6 relative">
              <span className="text-6xl font-black text-purple-700 tracking-tighter">{data.recommended_arrival_time}</span>
              <span className="text-lg font-bold text-slate-400 uppercase">Hrs</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed relative">Optimal window based on traffic patterns.</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: 8-Hour Forecast Chart */}
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm w-full">
        <h3 className="text-2xl font-bold text-gray-800 mb-10 flex items-center gap-3">
          <span className="p-2 bg-blue-50 rounded-lg">📈</span> Occupancy Forecast (Next 8 Hours)
        </h3>
        
        <div className="space-y-5">
          {data.forecast && data.forecast.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-6">
              <div className="w-24 text-sm font-bold text-gray-500 text-right">{item.time}</div>
              <div className="flex-1 bg-gray-50 h-10 rounded-2xl border border-gray-100 overflow-hidden relative group">
                <div 
                  className={`h-full transition-all duration-1000 shadow-sm ${
                    item.label === 'Critical' ? 'bg-red-500' : 
                    item.label === 'High' ? 'bg-orange-400' : 
                    item.label === 'Moderate' ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${item.occupancy}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                    {item.occupancy}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap gap-8 justify-center border-t border-gray-50 pt-8">
          {[
            { label: 'Low (<40%)', color: 'bg-green-400' },
            { label: 'Moderate (40-70%)', color: 'bg-yellow-400' },
            { label: 'High (70-90%)', color: 'bg-orange-400' },
            { label: 'Critical (>90%)', color: 'bg-red-500' }
          ].map((status) => (
            <div key={status.label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <div className={`w-4 h-4 ${status.color} rounded-md`}></div> {status.label}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Feature Status (One-Click Payment & Map Integration) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-blue-50 rounded-[2rem] text-left border border-blue-100">
          <h4 className="text-lg font-bold text-blue-900 mb-2">Interactive Map View</h4>
          <p className="text-sm text-blue-700">Gorgeous slot cards and filters that glide into view.</p>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">Open Map</button>
        </div>
        <div className="p-8 bg-orange-50 rounded-[2rem] text-left border border-orange-100">
          <h4 className="text-lg font-bold text-orange-900 mb-2">One-Click Payments</h4>
          <p className="text-sm text-orange-700">Fast confirmation modals and instant processing.</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-400 uppercase">
             <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div> Ready to Integrate
          </div>
        </div>
      </div>

    </div>
  );
};

export default AIDashboard;