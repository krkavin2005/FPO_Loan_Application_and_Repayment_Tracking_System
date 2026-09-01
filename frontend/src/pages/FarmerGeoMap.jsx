import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, SlidersHorizontal, Sliders, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// SVG divIcon maker to prevent asset load issues under Vite bundling
const getRiskColorPin = (riskLevel, activeLoanAmount) => {
  let pinColor = '#64748b'; // default slate-500 (No Active Loan)
  
  if (activeLoanAmount > 0) {
    if (riskLevel === 'LOW') pinColor = '#10b981'; // Green
    else if (riskLevel === 'MEDIUM') pinColor = '#f59e0b'; // Amber
    else if (riskLevel === 'HIGH') pinColor = '#f97316'; // Orange
    else if (riskLevel === 'CRITICAL') pinColor = '#ef4444'; // Red
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${pinColor}; 
      width: 18px; 
      height: 18px; 
      border-radius: 50%; 
      border: 2.5px solid #ffffff; 
      box-shadow: 0 0 10px rgba(0,0,0,0.6);
      transition: all 0.2s ease-in-out;
    " class="hover:scale-125"></div>`,
    className: 'custom-map-pin',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const FarmerGeoMap = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [cropFilter, setCropFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const fetchCoordinates = async () => {
    try {
      const res = await axios.get('/farmers/map/coords');
      setFarmers(res.data);
    } catch (err) {
      console.error('Error loading coordinate aggregates: ', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter application
  const filteredFarmers = farmers.filter((f) => {
    const matchesCrop = cropFilter === '' || f.primaryCrop === cropFilter;
    const matchesRisk = riskFilter === '' || (f.activeLoanAmount > 0 && f.riskLevel === riskFilter);
    const matchesDistrict = districtFilter === '' || f.district.toLowerCase().includes(districtFilter.toLowerCase());
    return matchesCrop && matchesRisk && matchesDistrict;
  });

  // Center coordinate around primary village cluster Mysuru
  const defaultCenter = [12.28, 76.70];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-emerald-400" />
          <span>Farmer Geo-Analytics Map</span>
        </h2>
        <p className="text-sm text-slate-400">
          Visualize spatial concentrations of borrowers, identify hot spots of credit outstanding, and inspect geographic default risk distributions.
        </p>
      </div>

      {/* Map Control Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl shadow-md flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wide mr-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Map Filters</span>
        </div>

        {/* Crop dropdown */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Primary Crop</span>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-350 focus:outline-none focus:border-emerald-500 text-xs w-40"
          >
            <option value="">All Crops</option>
            <option value="Paddy">Paddy / Rice</option>
            <option value="Wheat">Wheat</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Cotton">Cotton</option>
            <option value="Maize">Maize</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Groundnut">Groundnut</option>
          </select>
        </div>

        {/* Risk dropdown */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Lending Risk Level</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-350 focus:outline-none focus:border-emerald-500 text-xs w-40"
          >
            <option value="">All Risks</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* District search */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase">District Area</span>
          <div className="relative">
            <input
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-3 pr-8 text-slate-300 focus:outline-none focus:border-emerald-500 text-xs w-48"
              placeholder="e.g. Mysuru"
            />
            <span className="absolute inset-y-0 right-2 flex items-center text-slate-650 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="ml-auto text-xs text-slate-400 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-850">
          Showing <span className="font-bold text-emerald-400">{filteredFarmers.length}</span> farmers
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-3 h-[520px] relative">
        <MapContainer center={defaultCenter} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredFarmers.map((farmer) => {
            const hasActiveLoan = farmer.activeLoanAmount > 0;
            return (
              <Marker 
                key={farmer._id}
                position={[farmer.latitude, farmer.longitude]}
                icon={getRiskColorPin(farmer.riskLevel, farmer.activeLoanAmount)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs text-slate-800 space-y-1.5 min-w-[180px]">
                    <div className="font-bold border-b border-slate-200 pb-1 text-sm text-slate-900">
                      {farmer.name}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block">Location:</span>
                      <span className="font-bold text-slate-700 block">{farmer.village}, {farmer.district}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <div>
                        <span className="font-semibold text-slate-500 block">Crop:</span>
                        <span className="font-bold text-slate-800 block">{farmer.primaryCrop}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 block">Health Score:</span>
                        <span className="font-bold text-indigo-700 block">{farmer.financialHealthScore}/100</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200/60 mt-1 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-550 block font-semibold">Active Debt:</span>
                        <span className="font-extrabold text-emerald-700 block">
                          {hasActiveLoan ? `₹${farmer.activeLoanAmount.toLocaleString()}` : '₹0'}
                        </span>
                      </div>
                      {hasActiveLoan && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          farmer.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                          farmer.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-750'
                        }`}>
                          {farmer.riskLevel}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 text-right">
                      <Link 
                        to={`/farmers/${farmer._id}`}
                        className="text-[10px] font-bold text-emerald-600 hover:underline block"
                      >
                        Inspect Full Profile ➜
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-slate-950/90 border border-slate-850 p-3 rounded-xl shadow-xl space-y-1.5 text-[10px] text-slate-400 min-w-[140px] backdrop-blur-sm">
          <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1 mb-1.5">MAP PINS LEGEND</span>
          <div className="flex items-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full inline-block border border-white bg-[#10b981]" />
            <span>Low Default Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full inline-block border border-white bg-[#f59e0b]" />
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full inline-block border border-white bg-[#f97316]" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full inline-block border border-white bg-[#ef4444]" />
            <span>Critical Default Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full inline-block border border-white bg-[#64748b]" />
            <span>No Active Capital</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FarmerGeoMap;
