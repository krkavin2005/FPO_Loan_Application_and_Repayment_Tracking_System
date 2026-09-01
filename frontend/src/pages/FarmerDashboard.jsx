import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Sprout, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  ArrowRight,
  TrendingUp,
  FileSignature
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loansRes = await axios.get('/loans');
        setLoans(loansRes.data);

        // Fetch detailed profile calculations
        if (user?.farmerProfile?._id) {
          const profileRes = await axios.get(`/farmers/${user.farmerProfile._id}`);
          setProfileData(profileRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard datasets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Aggregate values
  const activeLoans = loans.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status));
  const pendingLoans = loans.filter(l => ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFIED'].includes(l.status));
  const outstandingAmount = profileData?.aggregates?.outstandingBalance || 0;
  const repaymentPercentage = profileData?.aggregates?.repaymentPercentage ?? 100;
  const healthScore = profileData?.farmer?.financialHealthScore || 60;

  // Determine score health color
  let scoreColor = 'text-red-400 border-red-900 bg-red-950/25';
  let scoreLevel = 'Critical';
  if (healthScore >= 80) {
    scoreColor = 'text-emerald-400 border-emerald-850 bg-emerald-950/20';
    scoreLevel = 'Excellent';
  } else if (healthScore >= 60) {
    scoreColor = 'text-green-400 border-green-900 bg-green-950/20';
    scoreLevel = 'Good';
  } else if (healthScore >= 40) {
    scoreColor = 'text-amber-400 border-amber-900 bg-amber-950/20';
    scoreLevel = 'Fair';
  } else if (healthScore >= 20) {
    scoreColor = 'text-orange-400 border-orange-950 bg-orange-950/20';
    scoreLevel = 'Poor';
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'DISBURSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">Active</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-950/45 text-yellow-400 border border-yellow-900/50">Pending</span>;
      case 'UNDER REVIEW':
      case 'DOCUMENT VERIFIED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-900/60">In Review</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-950/40 text-teal-400 border border-teal-900/60">Approved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-950/45 text-red-400 border border-red-900/50">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">Namaste, {user?.name}!</h2>
          <p className="text-sm text-slate-400">
            Welcome to your FPO borrowing profile. Here you can track your loan applications, generate EMI lists, and track health score reviews.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            to="/apply"
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10"
          >
            <FileSignature className="h-4 w-4" />
            <span>Apply for Loan</span>
          </Link>
        </div>
      </div>

      {/* KPI & Health Score Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Debt Card */}
        <div className="bg-slate-900 border border-slate-800/85 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Outstanding Debt</span>
            <div className="bg-emerald-950/50 p-2.5 rounded-lg text-emerald-400 border border-emerald-900/50">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="my-4">
            <span className="text-3xl font-extrabold text-white">₹{outstandingAmount.toLocaleString()}</span>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Across {activeLoans.length} active loan agreements</span>
            </div>
          </div>
          <div className="border-t border-slate-800/70 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">EMI Repayment Rate</span>
            <span className="font-semibold text-emerald-400">{repaymentPercentage}% paid</span>
          </div>
        </div>

        {/* Credit Health Scorecard */}
        <div className={`border p-6 rounded-2xl shadow-lg flex flex-col justify-between ${scoreColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider">Financial Health Score</span>
            <div className="p-1 rounded-md text-xs font-extrabold tracking-widest uppercase">
              {scoreLevel}
            </div>
          </div>
          <div className="my-4 flex items-baseline space-x-2">
            <span className="text-5xl font-black">{healthScore}</span>
            <span className="text-lg opacity-70">/100</span>
          </div>
          <div className="border-t border-slate-800/30 pt-3 text-xs leading-normal opacity-80">
            {healthScore >= 75 ? (
              <p>✓ Excellent. Repayments recorded on time. Low default risk category.</p>
            ) : healthScore >= 50 ? (
              <p>⚠ Good. Maintain timely repayments to qualify for larger lending limits.</p>
            ) : (
              <p>❌ Critical. Multiple overdue installments detected. Risk penalty applied.</p>
            )}
            <p className="text-[10px] italic mt-1.5 opacity-60">* System-generated assessment based on history.</p>
          </div>
        </div>

        {/* Dynamic Alerts Card */}
        <div className="bg-slate-900 border border-slate-800/85 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lending Summary</span>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Active Borrowings</span>
              <span className="font-bold text-white">{activeLoans.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pending Review</span>
              <span className="font-bold text-white">{pendingLoans.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Aggregated Income</span>
              <span className="font-bold text-white">₹{user?.farmerProfile?.annualIncome?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
          <div className="border-t border-slate-800/70 pt-3 text-[11px] text-slate-400">
            Primary Crop: <span className="font-semibold text-white">{user?.farmerProfile?.primaryCrop}</span> 
            {user?.farmerProfile?.secondaryCrop && ` | Secondary: ${user.farmerProfile.secondaryCrop}`}
          </div>
        </div>

      </div>

      {/* Loan Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">My Loan History</h3>
          </div>
          <span className="text-xs text-slate-400">Showing {loans.length} requests</span>
        </div>

        {loans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No loan records associated with your account yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "Apply for Loan" above to upload land title proofs and apply for credit assistance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Loan ID</th>
                  <th className="py-4 px-6">Amount Requested</th>
                  <th className="py-4 px-6">Purpose</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Interest Rate</th>
                  <th className="py-4 px-6">Risk Assessment</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-850/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{loan.loanId}</td>
                    <td className="py-4 px-6 font-bold text-slate-100">₹{loan.loanAmount.toLocaleString()}</td>
                    <td className="py-4 px-6">{loan.purpose}</td>
                    <td className="py-4 px-6">{loan.duration} months</td>
                    <td className="py-4 px-6 text-xs">{loan.interestRate}% (Flat)</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          loan.riskLevel === 'LOW' ? 'bg-emerald-500' :
                          loan.riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
                          loan.riskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs">{loan.riskLevel} ({loan.riskScore}%)</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/loans/${loan._id}`}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
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

export default FarmerDashboard;
