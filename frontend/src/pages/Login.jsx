import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sprout, Lock, Mail, User, Phone, MapPin, BadgePercent, Coins, Navigation } from 'lucide-react';

const Login = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const { login, registerFarmer } = useContext(AuthContext);
  const navigate = useNavigate();

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    governmentId: '',
    address: '',
    village: '',
    district: '',
    state: '',
    latitude: '',
    longitude: '',
    landArea: '',
    ownershipType: 'Owned',
    primaryCrop: 'Paddy',
    secondaryCrop: '',
    annualIncome: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(loginEmail, loginPassword);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Field Validations
    if (!regData.name || !regData.email || !regData.password || !regData.mobile || !regData.governmentId || !regData.landArea || !regData.annualIncome) {
      setErrorMsg('Please fill in all mandatory fields.');
      setLoading(false);
      return;
    }

    const result = await registerFarmer(regData);
    setLoading(false);
    if (result.success) {
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const fetchGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRegData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          setErrorMsg('Failed to fetch location. Please enter manually.');
        }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Decorative left panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-emerald-950/70 to-slate-900 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/25">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">AgriLend360</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">FPO Finance System</span>
            </div>
          </div>

          <div className="my-8 md:my-0 space-y-4">
            <h2 className="text-2xl font-bold text-slate-100 leading-tight">
              Empowering FPOs with Digital Lending & Risk Prediction
            </h2>
            <p className="text-sm text-slate-400">
              A transparent, data-driven platform for farmers, loan officers, and admins to manage the entire agricultural loan lifecycle.
            </p>
            <div className="flex flex-col space-y-2.5 pt-4">
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <Coins className="h-4 w-4 text-emerald-400" />
                <span>Default Risk assessment Engine</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Geographic borrower mapping</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <BadgePercent className="h-4 w-4 text-emerald-400" />
                <span>Dynamic Credit Health Scoring</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Powered by Secure JWT & Local Database Storage.
          </div>
        </div>

        {/* Form Panel */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-center">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 mb-6">
            <button
              onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                isLoginTab ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                !isLoginTab ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Farmer
            </button>
          </div>

          {/* Error and Success Notifications */}
          {errorMsg && (
            <div className="bg-red-950/30 text-red-400 border border-red-900/50 p-3 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 p-3 rounded-lg text-sm mb-4">
              {successMsg}
            </div>
          )}

          {isLoginTab ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary-500 text-sm transition-all"
                    placeholder="Enter email e.g. farmer@agrilend360.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary-500 text-sm transition-all"
                    placeholder="Enter account password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg shadow-primary-500/10 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                Demo Accounts: admin@agrilend360.com / officer@agrilend360.com / farmer@agrilend360.com (Pass: admin123 / officer123 / farmer123)
              </div>
            </form>
          ) : (
            /* Farmer Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="col-span-2 border-b border-slate-850 pb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Personal Profile</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={regData.name}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Farmer full name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={regData.mobile}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={regData.email}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="email@address.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={regData.password}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Password for account login"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Government / Aadhaar ID *</label>
                  <input
                    type="text"
                    name="governmentId"
                    required
                    value={regData.governmentId}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="12-digit Aadhaar number"
                  />
                </div>
                
                {/* Agricultural Details */}
                <div className="col-span-2 border-b border-slate-850 pt-2 pb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Agrarian & Financial Details</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Land Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="landArea"
                    required
                    value={regData.landArea}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="e.g. 5.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Ownership Type *</label>
                  <select
                    name="ownershipType"
                    value={regData.ownershipType}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                    <option value="Joint">Joint</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Primary Crop *</label>
                  <select
                    name="primaryCrop"
                    value={regData.primaryCrop}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="Paddy">Paddy / Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Maize">Maize</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Groundnut">Groundnut</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Secondary Crop (Optional)</label>
                  <input
                    type="text"
                    name="secondaryCrop"
                    value={regData.secondaryCrop}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="e.g. Mustard, Pulses"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Estimated Annual Income (₹) *</label>
                  <input
                    type="number"
                    name="annualIncome"
                    required
                    value={regData.annualIncome}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Total agricultural income in INR"
                  />
                </div>

                {/* Geography Details */}
                <div className="col-span-2 border-b border-slate-850 pt-2 pb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Geography Coordinates</span>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Full Address *</label>
                  <textarea
                    name="address"
                    required
                    value={regData.address}
                    onChange={handleRegChange}
                    rows="2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="House details, Landmark, Road name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">Village *</label>
                  <input
                    type="text"
                    name="village"
                    required
                    value={regData.village}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Village name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">District *</label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={regData.district}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="District name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-450 mb-1 font-semibold">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={regData.state}
                    onChange={handleRegChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="State name"
                  />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-slate-450 mb-1 font-semibold">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      required
                      value={regData.latitude}
                      onChange={handleRegChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                      placeholder="e.g. 12.3150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-450 mb-1 font-semibold">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      required
                      value={regData.longitude}
                      onChange={handleRegChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:border-primary-500"
                      placeholder="e.g. 76.6520"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={fetchGeoLocation}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Auto-detect GPS Coordinates</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Submitting Registration...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
