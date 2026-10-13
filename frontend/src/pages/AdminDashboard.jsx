import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, 
  Coins, 
  Wallet, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Landmark,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckSquare,
  Building2,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get('/analytics/dashboard');
        setData(statsRes.data);

        const loansRes = await axios.get('/loans');
        setRecentLoans(loansRes.data.slice(0, 8)); // Top 8 recent
      } catch (err) {
        console.error('Error fetching admin dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { kpis, charts } = data;

  // Chart data mappings
  // A. Crop Distribution
  const cropChartData = (charts.cropDistribution || []).map((item) => ({
    name: item._id || 'Other',
    amount: item.totalAmount,
    count: item.count,
  }));

  // B. Risk Distribution
  const riskChartData = (charts.riskDistribution || []).map((item) => ({
    name: item._id,
    count: item.count,
  }));

  const RISK_COLORS = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };

  // C. Status Distribution
  const statusChartData = (charts.statusDistribution || []).map((item) => ({
    name: item._id,
    value: item.count,
  }));
  const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#ef4444', '#14b8a6', '#64748b'];

  // D. Funding Source Distribution
  const fundingChartData = (charts.fundingSourceDistribution || []).map((item) => {
    const labels = {
      FPO_FUND: 'FPO Fund',
      PARTNER_BANK: 'Partner Bank',
      FINANCIAL_INSTITUTION: 'Financial Inst.',
      OTHER: 'Other Partner',
    };
    return {
      name: labels[item._id] || item._id,
      amount: item.totalAmount,
      count: item.count,
    };
  });
  const FUNDING_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  // E. Monthly History
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const combinedHistory = [];
  const tempMap = {};

  (charts.monthlyDisbursements || []).forEach((item) => {
    const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    if (!tempMap[key]) tempMap[key] = { month: key, disbursed: 0, repaid: 0 };
    tempMap[key].disbursed = item.amount;
  });

  (charts.monthlyRepayments || []).forEach((item) => {
    const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    if (!tempMap[key]) tempMap[key] = { month: key, disbursed: 0, repaid: 0 };
    tempMap[key].repaid = item.amount;
  });

  Object.keys(tempMap).forEach((key) => {
    combinedHistory.push(tempMap[key]);
  });

  if (combinedHistory.length === 0) {
    combinedHistory.push(
      { month: 'Jun 2026', disbursed: 120000, repaid: 40000 },
      { month: 'Jul 2026', disbursed: 180000, repaid: 95000 },
      { month: 'Aug 2026', disbursed: 220000, repaid: 140000 }
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">Active</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-950/45 text-yellow-400 border border-yellow-900/50">Pending</span>;
      case 'UNDER REVIEW':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-900/60">Under Review</span>;
      case 'DOCUMENT VERIFIED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-950/40 text-teal-400 border border-teal-900/60">Doc Verified</span>;
      case 'RECOMMENDED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800">Recommended</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-950/40 text-teal-400 border border-teal-900/60">Approved</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-950/45 text-red-400 border border-red-900/50">Rejected</span>;
      case 'NEEDS_INFORMATION':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-950/50 text-amber-400 border border-amber-800">Needs Info</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Building2 className="h-7 w-7 text-emerald-400" />
            <span>FPO Loan Portfolio & Credit Analytics</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Executive credit management console: portfolio monitoring, funding-source tracking, decision support, and risk governance.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <Link
            to="/map"
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-semibold border border-slate-850 hover:border-slate-750 rounded-xl transition duration-200"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Borrower Geo Map</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition duration-200"
          >
            <span>Export Reports</span>
          </Link>
        </div>
      </div>

      {/* 11 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        
        {/* 1. Total Farmers */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Farmers</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white block">{kpis.totalFarmers}</span>
            <span className="text-[10px] text-slate-500 block">Registered FPO members</span>
          </div>
        </div>

        {/* 2. Total Loan Applications */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Applications</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white block">{kpis.totalLoanApplications || 0}</span>
            <span className="text-[10px] text-slate-500 block">All credit requests</span>
          </div>
        </div>

        {/* 3. Approved Loans */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Approved Loans</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-teal-300 block">{kpis.approvedLoans || 0}</span>
            <span className="text-[10px] text-slate-500 block">Authorized by FPO</span>
          </div>
        </div>

        {/* 4. Active Loans */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Loans</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white block">{kpis.totalActiveLoans}</span>
            <span className="text-[10px] text-slate-500 block">Active repayment tracking</span>
          </div>
        </div>

        {/* 5. Total Disbursed */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Disbursed</span>
            <Landmark className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-white block">₹{kpis.totalDisbursedAmount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block">Recorded fund release</span>
          </div>
        </div>

        {/* 6. Total Repaid */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Repaid</span>
            <CheckSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-white block">₹{kpis.totalRepaymentsAmount.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              {kpis.totalDisbursedAmount > 0 
                ? `${Math.round((kpis.totalRepaymentsAmount / kpis.totalDisbursedAmount) * 100)}% recovery rate` 
                : '0% recovery'}
            </span>
          </div>
        </div>

        {/* 7. Outstanding Amount */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outstanding</span>
            <Wallet className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-white block">₹{kpis.outstandingAmount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block">Current principal balance</span>
          </div>
        </div>

        {/* 8. Overdue Amount */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue Balance</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-3">
            <span className={`text-lg font-bold block ${kpis.overdueAmount > 0 ? 'text-red-400' : 'text-slate-350'}`}>
              ₹{(kpis.overdueAmount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">Past-due installments</span>
          </div>
        </div>

        {/* 9. High-Risk Farmers */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">High Risk</span>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold block ${kpis.highRiskFarmers > 0 ? 'text-red-400' : 'text-slate-350'}`}>
              {kpis.highRiskFarmers}
            </span>
            <span className="text-[10px] text-slate-500 block">Critical defaults predicted</span>
          </div>
        </div>

        {/* 10. Pending Officer Reviews */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Officer Queue</span>
            <Clock className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-yellow-400 block">{kpis.pendingOfficerReviews || 0}</span>
            <span className="text-[10px] text-slate-500 block">Awaiting officer review</span>
          </div>
        </div>

        {/* 11. Pending Admin Decisions */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between shadow-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Admin Decisions</span>
            <CheckSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 block">{kpis.pendingAdminDecisions || 0}</span>
            <span className="text-[10px] text-slate-500 block">Ready for FPO decision</span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Historical Cash Flows */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Capital Disbursement vs Repayments</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="disbursed" name="Disbursed (₹)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="repaid" name="Repayments Recd (₹)" stroke="#6366f1" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Funding Source Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Funding Source Portfolio Share</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fundingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="amount" name="Total Capital Allocated (₹)" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {fundingChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNDING_COLORS[index % FUNDING_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Crop-Wise Lending */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Capital Allocated by Primary Crop Cultivation</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="amount" name="Capital (₹)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Active Borrowings Risk Share</h4>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 text-xs text-slate-400">
              {riskChartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: RISK_COLORS[entry.name] || '#64748b' }} />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-bold text-white">{entry.count} active loans</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Loans Overview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Recent FPO Borrowing Applications</h3>
          </div>
          <Link
            to="/farmers"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Manage All Farmers</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Loan ID</th>
                <th className="py-4 px-6">Farmer</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Funding Source</th>
                <th className="py-4 px-6">Officer Recommendation</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {recentLoans.map((loan) => (
                <tr key={loan._id} className="hover:bg-slate-850/40 transition">
                  <td className="py-4 px-6 font-semibold text-white">{loan.loanId}</td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-200">{loan.farmerId?.name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{loan.farmerId?.village}</div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">₹{loan.loanAmount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-xs text-amber-300 font-medium">
                    {loan.fundingSource || 'FPO_FUND'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      loan.officerRecommendation === 'RECOMMEND APPROVAL' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                      loan.officerRecommendation === 'RECOMMEND REJECTION' ? 'bg-red-950/40 text-red-400 border border-red-900' :
                      loan.officerRecommendation === 'NEEDS ADDITIONAL INFORMATION' ? 'bg-amber-950/40 text-amber-400 border border-amber-900' :
                      'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}>
                      {loan.officerRecommendation || 'NONE'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">{getStatusBadge(loan.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/loans/${loan._id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 hover:border-slate-600 transition"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
