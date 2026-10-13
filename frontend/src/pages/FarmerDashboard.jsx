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
  FileSignature,
  Building2,
  Calendar,
  ShieldCheck,
  Info
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
  const pendingLoans = loans.filter(l => ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFIED', 'RECOMMENDED'].includes(l.status));
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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">Active Amortizing</span>;
      case 'DISBURSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-950/50 text-teal-300 border border-teal-800/60">Disbursed</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-950/50 text-yellow-400 border border-yellow-800/60">Submitted (Pending)</span>;
      case 'UNDER REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-800/60">Under Officer Review</span>;
      case 'DOCUMENT VERIFICATION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-800/60">Doc Verification</span>;
      case 'DOCUMENT VERIFIED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-950/50 text-teal-400 border border-teal-800/60">Documents Verified</span>;
      case 'ASSESSMENT COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/50 text-purple-300 border border-purple-800/60">Assessment Completed</span>;
      case 'RECOMMENDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/50 text-purple-400 border border-purple-800/60">Officer Recommended</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/60">Approved by FPO</span>;
      case 'REPAYMENT MONITORING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">Repayment Monitoring</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed (Paid)</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-950/50 text-red-400 border border-red-800/60">Rejected</span>;
      case 'NEEDS_INFORMATION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/60">Needs Information</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800/90 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              FPO Member Profile
            </span>
            <span className="text-xs text-slate-400">
              Village: <strong className="text-slate-200">{user?.farmerProfile?.village || 'Member Village'}</strong>
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Vanakkam, {user?.name}!</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Welcome to your FPO credit dashboard. Track your credit applications, review automated decision-support assessments, and monitor your EMI repayment schedule.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 shrink-0">
          <Link
            to="/apply"
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10"
          >
            <FileSignature className="h-4 w-4" />
            <span>Apply for Credit</span>
          </Link>
        </div>
      </div>

      {/* FPO Informational Banner */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">How AgriLend360 FPO Credit Works: </strong>
          AgriLend360 provides digital credit evaluation and repayment tracking for your Farmer Producer Organization (FPO). Approved loans are funded through designated FPO internal capital or approved partner banking institutions.
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
              <span>Across {activeLoans.length} active loan facility</span>
            </div>
          </div>
          <div className="border-t border-slate-800/70 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">EMI Repayment Rate</span>
            <span className="font-semibold text-emerald-400">{repaymentPercentage}% paid on time</span>
          </div>
        </div>

        {/* Credit Health Scorecard */}
        <div className={`border p-6 rounded-2xl shadow-lg flex flex-col justify-between ${scoreColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider">Credit Health Score</span>
            <div className="p-1 rounded-md text-xs font-extrabold tracking-widest uppercase">
              {scoreLevel}
            </div>
          </div>
          <div className="my-4 flex items-baseline space-x-2">
            <span className="text-5xl font-black">{healthScore}</span>
            <span className="text-lg opacity-70">/100</span>
          </div>
          <div className="border-t border-slate-800/30 pt-3 text-xs leading-normal opacity-90">
            {healthScore >= 75 ? (
              <p>✓ Excellent credit profile. Timely EMI payments qualify you for priority FPO credit limits.</p>
            ) : healthScore >= 50 ? (
              <p>⚠ Satisfactory profile. Maintain consistent installments to raise your score.</p>
            ) : (
              <p>❌ Attention required. Overdue installments negatively impact future credit eligibility.</p>
            )}
            <p className="text-[10px] italic mt-1.5 opacity-70">* Decision-support score based on repayment discipline and crop income.</p>
          </div>
        </div>

        {/* Profile & Lending Summary */}
        <div className="bg-slate-900 border border-slate-800/85 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">FPO Profile Summary</span>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Active Facilities</span>
              <span className="font-bold text-white">{activeLoans.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Applications in Review</span>
              <span className="font-bold text-white">{pendingLoans.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Registered Land</span>
              <span className="font-bold text-white">{user?.farmerProfile?.landSize || 0} Acres</span>
            </div>
          </div>
          <div className="border-t border-slate-800/70 pt-3 text-[11px] text-slate-400">
            Primary Crop: <span className="font-semibold text-white">{user?.farmerProfile?.primaryCrop || 'Cultivation'}</span> 
            {user?.farmerProfile?.secondaryCrop && ` | Secondary: ${user.farmerProfile.secondaryCrop}`}
          </div>
        </div>

      </div>

      {/* Loan Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">My FPO Credit Applications & Loans</h3>
          </div>
          <span className="text-xs text-slate-400">Showing {loans.length} requests</span>
        </div>

        {loans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No loan records associated with your account yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "Apply for Credit" above to upload land and KYC documents to begin your application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Loan ID</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Purpose</th>
                  <th className="py-4 px-6">Tenure</th>
                  <th className="py-4 px-6">Interest Rate</th>
                  <th className="py-4 px-6">Decision-Support Assessment</th>
                  <th className="py-4 px-6 text-center">Workflow Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-850/40 transition">
                    <td className="py-4 px-6 font-semibold text-white font-mono text-xs">{loan.loanId}</td>
                    <td className="py-4 px-6 font-bold text-slate-100">₹{loan.loanAmount.toLocaleString()}</td>
                    <td className="py-4 px-6">{loan.purpose}</td>
                    <td className="py-4 px-6">{loan.duration} months</td>
                    <td className="py-4 px-6 text-xs">{loan.interestRate}% p.a.</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          loan.riskLevel === 'LOW' ? 'bg-emerald-500' :
                          loan.riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
                          loan.riskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs font-medium">{loan.riskLevel} Risk</span>
                        <span className="text-[11px] text-slate-500">({loan.eligibilityScore || 0}/100)</span>
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
