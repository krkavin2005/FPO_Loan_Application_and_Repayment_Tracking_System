import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FileCheck, 
  Users, 
  Search, 
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  Eye,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const OfficerDashboard = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await axios.get('/loans');
      setLoans(res.data);
    } catch (err) {
      console.error('Error fetching loan records for officer: ', err);
    } finally {
      setLoading(false);
    }
  };

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
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-900/20 text-emerald-400 border border-emerald-800">Approved</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-950/45 text-red-400 border border-red-900/50">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-350">{status}</span>;
    }
  };

  // Filter logic
  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = statusFilter === '' || loan.status === statusFilter;
    const matchesRisk = riskFilter === '' || loan.riskLevel === riskFilter;
    
    const name = loan.farmerId?.name?.toLowerCase() || '';
    const village = loan.farmerId?.village?.toLowerCase() || '';
    const loanId = loan.loanId?.toLowerCase() || '';
    const matchesSearch = 
      name.includes(searchTerm.toLowerCase()) ||
      village.includes(searchTerm.toLowerCase()) ||
      loanId.includes(searchTerm.toLowerCase());

    return matchesStatus && matchesRisk && matchesSearch;
  });

  const pendingVerification = loans.filter(l => l.status === 'PENDING').length;
  const underReviewCount = loans.filter(l => l.status === 'UNDER REVIEW').length;
  const docsVerifiedCount = loans.filter(l => l.status === 'DOCUMENT VERIFIED').length;
  const criticalRiskCount = loans.filter(l => l.status === 'ACTIVE' && l.riskLevel === 'CRITICAL').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Loan Verification Queue</h2>
        <p className="text-sm text-slate-400">
          Review borrower eligibility documents, inspect risk engine calculations, and recommend credit decisions.
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">New Submissions</span>
            <span className="text-2xl font-bold text-white mt-1 block">{pendingVerification}</span>
          </div>
          <div className="bg-yellow-950/40 text-yellow-500 p-3 rounded-xl border border-yellow-900/40">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Under Active Review</span>
            <span className="text-2xl font-bold text-white mt-1 block">{underReviewCount}</span>
          </div>
          <div className="bg-indigo-950/40 text-indigo-400 p-3 rounded-xl border border-indigo-900/40">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Documents Verified</span>
            <span className="text-2xl font-bold text-white mt-1 block">{docsVerifiedCount}</span>
          </div>
          <div className="bg-emerald-950/40 text-emerald-400 p-3 rounded-xl border border-emerald-900/40">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Critical Risk Loans</span>
            <span className="text-2xl font-bold text-red-400 mt-1 block">{criticalRiskCount}</span>
          </div>
          <div className="bg-red-950/40 text-red-500 p-3 rounded-xl border border-red-900/40">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm transition"
            placeholder="Search by ID, Farmer name, or village..."
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="DOCUMENT VERIFIED">DOCUMENT VERIFIED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="w-full md:w-48">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="">All Risks</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <h3 className="text-lg font-bold text-white">Application Records</h3>
          <span className="text-xs text-slate-400">Found {filteredLoans.length} matches</span>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium">No application records matched your active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Loan ID</th>
                  <th className="py-4 px-6">Farmer Name</th>
                  <th className="py-4 px-6">Village</th>
                  <th className="py-4 px-6">Crop</th>
                  <th className="py-4 px-6">Amount Requested</th>
                  <th className="py-4 px-6">Default Prob.</th>
                  <th className="py-4 px-6">Risk Category</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-850/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{loan.loanId}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200">{loan.farmerId?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{loan.farmerId?.mobile}</div>
                    </td>
                    <td className="py-4 px-6 text-xs">{loan.farmerId?.village}</td>
                    <td className="py-4 px-6">{loan.farmerId?.primaryCrop}</td>
                    <td className="py-4 px-6 font-bold text-slate-100">₹{loan.loanAmount.toLocaleString()}</td>
                    <td className="py-4 px-6 font-semibold text-xs">{loan.riskScore}%</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        loan.riskLevel === 'LOW' ? 'bg-emerald-950/30 text-emerald-400' :
                        loan.riskLevel === 'MEDIUM' ? 'bg-yellow-950/30 text-yellow-400' :
                        loan.riskLevel === 'HIGH' ? 'bg-orange-950/30 text-orange-400' : 'bg-red-950/30 text-red-400'
                      }`}>
                        {loan.riskLevel}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/loans/${loan._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-900/60 hover:border-emerald-800 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
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

export default OfficerDashboard;
