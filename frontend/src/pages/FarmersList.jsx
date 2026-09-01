import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Search, SlidersHorizontal, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

const FarmersList = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const res = await axios.get('/farmers');
      setFarmers(res.data);
    } catch (err) {
      console.error('Error fetching farmer directories: ', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter application
  const filteredFarmers = farmers.filter((f) => {
    const matchesDistrict = districtFilter === '' || f.district.toLowerCase().includes(districtFilter.toLowerCase());
    const matchesCrop = cropFilter === '' || f.primaryCrop === cropFilter;
    
    const name = f.name?.toLowerCase() || '';
    const mobile = f.mobile?.toLowerCase() || '';
    const village = f.village?.toLowerCase() || '';
    const matchesSearch = 
      name.includes(searchTerm.toLowerCase()) ||
      mobile.includes(searchTerm.toLowerCase()) ||
      village.includes(searchTerm.toLowerCase());

    return matchesDistrict && matchesCrop && matchesSearch;
  });

  const getScoreBadge = (score) => {
    let color = 'bg-red-950/30 text-red-400 border-red-900/60';
    if (score >= 80) color = 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60';
    else if (score >= 60) color = 'bg-green-950/30 text-green-400 border-green-900/60';
    else if (score >= 40) color = 'bg-amber-950/30 text-amber-400 border-amber-900/60';
    
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${color}`}>
        {score} / 100
      </span>
    );
  };

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
          <Users className="h-6 w-6 text-emerald-400" />
          <span>FPO Farmers Directory</span>
        </h2>
        <p className="text-sm text-slate-400">
          Search, filter, and inspect detailed profiles of registered farmer members, their assets, and credit scores.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-505">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm transition"
            placeholder="Search by name, contact, or village..."
          />
        </div>

        {/* Crop filter */}
        <div className="w-full md:w-48">
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-350 focus:outline-none focus:border-emerald-500 text-sm"
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

        {/* District input filter */}
        <div className="w-full md:w-48">
          <input
            type="text"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
            placeholder="Filter by district..."
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Farmer Directory Index</h3>
          <span className="text-xs text-slate-450">Displaying {filteredFarmers.length} members</span>
        </div>

        {filteredFarmers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm">No farmer profile records found matching the active search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  <th className="py-4 px-6">Farmer Name</th>
                  <th className="py-4 px-6">Mobile Contact</th>
                  <th className="py-4 px-6">Village</th>
                  <th className="py-4 px-6">District / State</th>
                  <th className="py-4 px-6">Land Acreage</th>
                  <th className="py-4 px-6">Cultivating Crops</th>
                  <th className="py-4 px-6">Credit Score</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer._id} className="hover:bg-slate-850/40 transition">
                    <td className="py-4 px-6">
                      <Link 
                        to={`/farmers/${farmer._id}`} 
                        className="font-bold text-slate-200 hover:text-emerald-450 transition"
                      >
                        {farmer.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">{farmer.mobile}</td>
                    <td className="py-4 px-6">{farmer.village}</td>
                    <td className="py-4 px-6 text-xs">{farmer.district}, {farmer.state}</td>
                    <td className="py-4 px-6 font-semibold">{farmer.landArea} acres</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-white">{farmer.primaryCrop}</span>
                      {farmer.secondaryCrop && (
                        <span className="text-xs text-slate-500 block">Sec: {farmer.secondaryCrop}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">{getScoreBadge(farmer.financialHealthScore)}</td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/farmers/${farmer._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 hover:border-slate-650 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default FarmersList;
