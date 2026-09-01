import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  User, 
  MapPin, 
  Sprout, 
  Coins, 
  TrendingUp, 
  Award,
  AlertTriangle,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';

const FarmerProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine profile ID (if none passed, default to logged in farmer's profile)
  const profileId = id || user?.farmerProfile?._id;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    } else {
      setLoading(false);
      setErrorMsg('No farmer profile ID was specified.');
    }
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/farmers/${profileId}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch farmer profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="text-center py-12 text-slate-400 space-y-4">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p>{errorMsg || 'Profile details not found.'}</p>
        <Link to="/" className="text-emerald-400 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const { farmer, aggregates } = profile;
  const healthScore = farmer.financialHealthScore || 50;

  // Health Score Style
  let dialColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  let dialLevel = 'Low';
  let dialRemarks = 'Excellent repayment history and stable income assets.';
  
  if (healthScore < 40) {
    dialColor = 'text-red-400 border-red-500/30 bg-red-950/20';
    dialLevel = 'Critical';
    dialRemarks = 'Default warnings active. Multiple unpaid EMI logs detected.';
  } else if (healthScore < 60) {
    dialColor = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    dialLevel = 'Medium';
    dialRemarks = 'Slight payment slips or high debt utilization balance.';
  } else if (healthScore < 80) {
    dialColor = 'text-green-400 border-green-500/30 bg-green-950/20';
    dialLevel = 'Low';
    dialRemarks = 'Satisfactory overall repayments and good land asset backing.';
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Back link */}
      <div>
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-emerald-400 shadow-inner">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{farmer.name}</h2>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>{farmer.village}, {farmer.district}, {farmer.state}</span>
            </div>
          </div>
        </div>
        <div className="text-xs bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl space-y-1">
          <span className="text-slate-500 uppercase block font-semibold">FPO Member Since</span>
          <span className="font-bold text-slate-300 block">{new Date(farmer.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Grid: Details Left, Health Score Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Demographic and Agricultural Asset Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Agrarian Assets Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-850 pb-2">
              <Sprout className="h-4.5 w-4.5 text-emerald-400" />
              <span>Agricultural Assets</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-6 text-xs text-slate-350">
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Primary Crop Cultivation</span>
                <span className="text-sm font-bold text-slate-100">{farmer.primaryCrop}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Secondary Crop</span>
                <span className="text-sm font-bold text-slate-100">{farmer.secondaryCrop || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Land Holding Area</span>
                <span className="text-sm font-bold text-slate-100">{farmer.landArea} Acres</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Land Ownership Type</span>
                <span className="text-sm font-bold text-slate-100">{farmer.ownershipType}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Village Coordinates</span>
                <span className="text-sm font-semibold text-slate-200">Lat: {farmer.latitude} | Lng: {farmer.longitude}</span>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-semibold block mb-0.5">Address</span>
                <span className="text-xs text-slate-350 leading-relaxed block">{farmer.address}</span>
              </div>
            </div>
          </div>

          {/* Demographics / Personal Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-850 pb-2">
              <User className="h-4.5 w-4.5 text-emerald-400" />
              <span>Farmer Demographics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-350">
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Mobile Contact</span>
                <span className="text-sm font-semibold text-slate-200">{farmer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Aadhaar ID (KYC Masked)</span>
                <span className="text-sm font-mono text-slate-200">{farmer.governmentId}</span>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-semibold block mb-0.5">Est. Annual income</span>
                <span className="text-sm font-bold text-slate-100">₹{farmer.annualIncome?.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Financial Performance and Health Score card */}
        <div className="space-y-6">
          
          {/* Health Scorecard */}
          <div className={`border p-6 rounded-2xl shadow-lg space-y-4 ${dialColor}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2 border-b border-slate-850 pb-2">
              <Award className="h-4.5 w-4.5" />
              <span>Credit health assessment</span>
            </h3>

            <div className="text-center py-4">
              <span className="text-5xl font-black">{healthScore}</span>
              <span className="text-lg opacity-70">/100</span>
              <div className="mt-1 font-bold text-xs uppercase tracking-widest">{dialLevel} Risk Tier</div>
            </div>

            <div className="text-xs leading-normal opacity-85 space-y-2">
              <p>{dialRemarks}</p>
              <p className="text-[10px] italic border-t border-slate-800/30 pt-2 opacity-65">
                * Dynamic scoring updates automatically with every payment event or status record check.
              </p>
            </div>
          </div>

          {/* Financial Aggregates Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-850 pb-2">
              <Coins className="h-4.5 w-4.5 text-emerald-400" />
              <span>Lending Performance</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Borrowings</span>
                <span className="font-bold text-slate-200">{aggregates.activeLoans} loans</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Settled Contracts</span>
                <span className="font-bold text-slate-200">{aggregates.completedLoans} closed</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Borrowed Capital</span>
                <span className="font-bold text-white">₹{aggregates.totalBorrowed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Capital Repaid</span>
                <span className="font-bold text-emerald-400">₹{aggregates.totalRepaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                <span className="text-slate-450 uppercase font-semibold">Remaining Balance</span>
                <span className="text-sm font-extrabold text-white">₹{aggregates.outstandingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Amortization Paid Ratio</span>
                <span className="font-bold text-emerald-400">{aggregates.repaymentPercentage}% paid</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default FarmerProfile;
