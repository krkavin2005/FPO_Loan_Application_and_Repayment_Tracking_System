import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FileCheck, 
  Users, 
  Search, 
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  Eye,
  AlertTriangle,
  FolderOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Filter,
  Check,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('');
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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">Active Amortization</span>;
      case 'DISBURSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-950/50 text-teal-300 border border-teal-800/60">Disbursed</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-950/50 text-yellow-400 border border-yellow-800/60">Pending Assignment</span>;
      case 'UNDER REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-800/60">Under Officer Review</span>;
      case 'DOCUMENT VERIFICATION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-800/60">Doc Verification</span>;
      case 'DOCUMENT VERIFIED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-950/50 text-teal-400 border border-teal-800/60">Documents Verified</span>;
      case 'ASSESSMENT COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/50 text-purple-300 border border-purple-800/60">Assessment Completed</span>;
      case 'RECOMMENDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/50 text-purple-400 border border-purple-800/60">Recommendation Submitted</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/60">FPO Approved (Pending Disb.)</span>;
      case 'REPAYMENT MONITORING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">Repayment Monitoring</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-950/50 text-red-400 border border-red-800/60">Rejected</span>;
      case 'NEEDS_INFORMATION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/60">Needs More Info</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'RECOMMEND APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="h-3 w-3" />
            Recommend Approval
          </span>
        );
      case 'RECOMMEND REJECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-950/40 text-red-400 border border-red-800/50">
            <XCircle className="h-3 w-3" />
            Recommend Rejection
          </span>
        );
      case 'NEEDS ADDITIONAL INFORMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/50">
            <AlertCircle className="h-3 w-3" />
            Needs Information
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 bg-slate-800/60 rounded border border-slate-700">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
    }
  };

  const getDocumentStatus = (loan) => {
    const docs = loan.documents || [];
    if (docs.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <FileText className="h-3 w-3 text-slate-500" />
          No docs
        </span>
      );
    }
    const verifiedCount = docs.filter(d => d.verificationStatus === 'VERIFIED').length;
    const rejectedCount = docs.filter(d => d.verificationStatus === 'REJECTED').length;
    const pendingCount = docs.filter(d => d.verificationStatus === 'PENDING').length;

    if (rejectedCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-red-950/40 text-red-400 border border-red-900/50">
          <XCircle className="h-3 w-3" />
          {rejectedCount} Rejected
        </span>
      );
    }
    if (pendingCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-yellow-950/40 text-yellow-400 border border-yellow-900/50">
          <Clock className="h-3 w-3" />
          {verifiedCount}/{docs.length} Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-teal-950/40 text-teal-400 border border-teal-900/50">
        <CheckCircle2 className="h-3 w-3" />
        All {docs.length} Verified
      </span>
    );
  };

  // KPI calculations matching Section 18
  const assignedPendingCount = loans.filter(l => ['PENDING', 'UNDER REVIEW'].includes(l.status)).length;
  const underReviewCount = loans.filter(l => l.status === 'UNDER REVIEW').length;
  const docsAwaitingCount = loans.filter(l => {
    const docs = l.documents || [];
    return ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFICATION'].includes(l.status) && 
      (docs.length === 0 || docs.some(d => d.verificationStatus === 'PENDING'));
  }).length;
  const assessmentReadyCount = loans.filter(l => l.riskScore !== undefined && l.eligibilityScore !== undefined).length;
  const readyForRecommendationCount = loans.filter(l => 
    (l.status === 'DOCUMENT VERIFIED' || (l.documents && l.documents.length > 0 && l.documents.every(d => d.verificationStatus === 'VERIFIED'))) &&
    (!l.officerRecommendation || l.officerRecommendation === 'NONE')
  ).length;
  const recommendedApprovalsCount = loans.filter(l => l.officerRecommendation === 'RECOMMEND APPROVAL').length;
  const recommendedRejectionsCount = loans.filter(l => l.officerRecommendation === 'RECOMMEND REJECTION').length;
  const activeMonitoredCount = loans.filter(l => l.status === 'ACTIVE').length;
  const overdueRepaymentsCount = loans.filter(l => l.hasOverdue || (l.repayments && l.repayments.some(r => r.status === 'OVERDUE'))).length;
  const highRiskCount = loans.filter(l => ['HIGH', 'CRITICAL'].includes(l.riskLevel)).length;

  // Filter tab handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter('');
    setRiskFilter('');
    setRecommendationFilter('');
  };

  // Main filter logic
  const filteredLoans = loans.filter((loan) => {
    // Tab filters
    if (activeTab === 'PENDING') {
      if (!['PENDING', 'UNDER REVIEW'].includes(loan.status)) return false;
    } else if (activeTab === 'DOCS_AWAITING') {
      const docs = loan.documents || [];
      const hasPendingDoc = docs.some(d => d.verificationStatus === 'PENDING') || docs.length === 0;
      if (!hasPendingDoc && loan.status !== 'DOCUMENT VERIFICATION') return false;
    } else if (activeTab === 'READY_FOR_REC') {
      const isDocDone = loan.status === 'DOCUMENT VERIFIED' || (loan.documents && loan.documents.length > 0 && loan.documents.every(d => d.verificationStatus === 'VERIFIED'));
      const isPendingRec = !loan.officerRecommendation || loan.officerRecommendation === 'NONE';
      if (!isDocDone || !isPendingRec) return false;
    } else if (activeTab === 'RECOMMENDED_APPROVAL') {
      if (loan.officerRecommendation !== 'RECOMMEND APPROVAL') return false;
    } else if (activeTab === 'RECOMMENDED_REJECTION') {
      if (loan.officerRecommendation !== 'RECOMMEND REJECTION') return false;
    } else if (activeTab === 'ACTIVE_MONITORING') {
      if (loan.status !== 'ACTIVE') return false;
    } else if (activeTab === 'OVERDUE') {
      const hasOverdue = loan.hasOverdue || (loan.repayments && loan.repayments.some(r => r.status === 'OVERDUE'));
      if (!hasOverdue) return false;
    } else if (activeTab === 'HIGH_RISK') {
      if (!['HIGH', 'CRITICAL'].includes(loan.riskLevel)) return false;
    }

    // Dropdown filters
    const matchesStatus = statusFilter === '' || loan.status === statusFilter;
    const matchesRisk = riskFilter === '' || loan.riskLevel === riskFilter;
    const matchesRec = recommendationFilter === '' || loan.officerRecommendation === recommendationFilter;
    
    // Search
    const name = loan.farmerId?.name?.toLowerCase() || '';
    const village = loan.farmerId?.village?.toLowerCase() || '';
    const mobile = loan.farmerId?.mobile?.toLowerCase() || '';
    const loanId = loan.loanId?.toLowerCase() || '';
    const crop = loan.farmerId?.primaryCrop?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      name.includes(term) ||
      village.includes(term) ||
      mobile.includes(term) ||
      loanId.includes(term) ||
      crop.includes(term);

    return matchesStatus && matchesRisk && matchesRec && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
                Loan Officer Credit Desk
              </span>
              <span className="text-xs text-slate-400">
                Logged in as: <strong className="text-white">{user?.name || 'Loan Officer'}</strong>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Loan Verification & Recommendation Queue
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Digitally verify borrower KYC and land documents, evaluate system risk analytics, and submit formal credit recommendations for FPO committee decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLoans()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              Refresh Queue
            </button>
          </div>
        </div>
      </div>

      {/* 10 Queue Counters (Section 18) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Queue Counters & Caseload Summary</h3>
          <span className="text-xs text-slate-500">{loans.length} total loan files in platform</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Assigned/Pending Review */}
          <div 
            onClick={() => handleTabChange('PENDING')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'PENDING' ? 'bg-yellow-950/40 border-yellow-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-yellow-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{assignedPendingCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Awaiting assessment</div>
          </div>

          {/* 2. Under Review */}
          <div 
            onClick={() => { setActiveTab('ALL'); setStatusFilter('UNDER REVIEW'); }}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              statusFilter === 'UNDER REVIEW' ? 'bg-indigo-950/40 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{underReviewCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">In active examination</div>
          </div>

          {/* 3. Documents Awaiting */}
          <div 
            onClick={() => handleTabChange('DOCS_AWAITING')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'DOCS_AWAITING' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Docs to Verify</span>
              <FileText className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{docsAwaitingCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">KYC / Land checks</div>
          </div>

          {/* 4. Assessment Ready */}
          <div 
            className="p-4 rounded-xl border bg-slate-900 border-slate-800 shadow-md"
          >
            <div className="flex items-center justify-between text-teal-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Assessed Files</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{assessmentReadyCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Risk scores computed</div>
          </div>

          {/* 5. Ready for Recommendation */}
          <div 
            onClick={() => handleTabChange('READY_FOR_REC')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'READY_FOR_REC' ? 'bg-teal-950/40 border-teal-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-teal-300 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Ready for Rec</span>
              <FileCheck className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{readyForRecommendationCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Docs verified, no rec</div>
          </div>

          {/* 6. Recommended Approvals */}
          <div 
            onClick={() => handleTabChange('RECOMMENDED_APPROVAL')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'RECOMMENDED_APPROVAL' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Rec. Approvals</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{recommendedApprovalsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Recommended for FPO</div>
          </div>

          {/* 7. Recommended Rejections */}
          <div 
            onClick={() => handleTabChange('RECOMMENDED_REJECTION')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'RECOMMENDED_REJECTION' ? 'bg-red-950/40 border-red-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-red-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Rec. Rejections</span>
              <XCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{recommendedRejectionsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Not advised for credit</div>
          </div>

          {/* 8. Active Monitored */}
          <div 
            onClick={() => handleTabChange('ACTIVE_MONITORING')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'ACTIVE_MONITORING' ? 'bg-blue-950/40 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-blue-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Active Monitoring</span>
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">{activeMonitoredCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Disbursed amortizing</div>
          </div>

          {/* 9. Overdue Repayments */}
          <div 
            onClick={() => handleTabChange('OVERDUE')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'OVERDUE' ? 'bg-orange-950/40 border-orange-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-orange-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Overdue Cases</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-orange-400">{overdueRepaymentsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Missed installments</div>
          </div>

          {/* 10. High-Risk Cases */}
          <div 
            onClick={() => handleTabChange('HIGH_RISK')}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-md ${
              activeTab === 'HIGH_RISK' ? 'bg-red-950/40 border-red-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-red-500 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">High / Critical</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-red-400">{highRiskCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Default risk &gt; 45%</div>
          </div>
        </div>
      </div>

      {/* Quick Action Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'ALL' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          All Applications ({loans.length})
        </button>
        <button
          onClick={() => handleTabChange('PENDING')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'PENDING' 
              ? 'bg-yellow-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          Review Application Queue ({assignedPendingCount})
        </button>
        <button
          onClick={() => handleTabChange('DOCS_AWAITING')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'DOCS_AWAITING' 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          Verify Documents ({docsAwaitingCount})
        </button>
        <button
          onClick={() => handleTabChange('READY_FOR_REC')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'READY_FOR_REC' 
              ? 'bg-teal-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          Submit Recommendation ({readyForRecommendationCount})
        </button>
        <button
          onClick={() => handleTabChange('RECOMMENDED_APPROVAL')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'RECOMMENDED_APPROVAL' 
              ? 'bg-emerald-700 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          Recommended Approvals ({recommendedApprovalsCount})
        </button>
        <button
          onClick={() => handleTabChange('ACTIVE_MONITORING')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'ACTIVE_MONITORING' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          Active Monitored ({activeMonitoredCount})
        </button>
        <button
          onClick={() => handleTabChange('HIGH_RISK')}
          className={`px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'HIGH_RISK' 
              ? 'bg-red-700 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          High Risk Attention ({highRiskCount})
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center gap-3">
        
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
            placeholder="Search by Loan ID, Farmer name, mobile, crop, village..."
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="DOCUMENT VERIFIED">DOC VERIFIED</option>
            <option value="RECOMMENDED">RECOMMENDED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="NEEDS_INFORMATION">NEEDS INFO</option>
          </select>
        </div>

        {/* Recommendation Filter */}
        <div className="w-full md:w-48">
          <select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="">All Recommendations</option>
            <option value="RECOMMEND APPROVAL">Recommend Approval</option>
            <option value="RECOMMEND REJECTION">Recommend Rejection</option>
            <option value="NEEDS ADDITIONAL INFORMATION">Needs Information</option>
            <option value="NONE">Pending Recommendation</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="w-full md:w-36">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="">All Risks</option>
            <option value="LOW">LOW Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="HIGH">HIGH Risk</option>
            <option value="CRITICAL">CRITICAL Risk</option>
          </select>
        </div>

        {(searchTerm || statusFilter || riskFilter || recommendationFilter || activeTab !== 'ALL') && (
          <button
            onClick={() => {
              setActiveTab('ALL');
              setStatusFilter('');
              setRiskFilter('');
              setRecommendationFilter('');
              setSearchTerm('');
            }}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 bg-slate-800 rounded-lg transition shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">Loan Verification Caseload</h3>
            <p className="text-xs text-slate-400">Click any row action to inspect KYC documents, assess risk, or submit credit recommendation.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
            {filteredLoans.length} cases shown
          </span>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium">No application records matched your active filter criteria.</p>
            <button
              onClick={() => {
                setActiveTab('ALL');
                setStatusFilter('');
                setRiskFilter('');
                setRecommendationFilter('');
                setSearchTerm('');
              }}
              className="mt-3 text-xs text-emerald-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Loan ID</th>
                  <th className="py-4 px-5">Farmer & Contact</th>
                  <th className="py-4 px-4">Crop / Purpose</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Assigned Officer</th>
                  <th className="py-4 px-4">Documents</th>
                  <th className="py-4 px-4">Decision Support</th>
                  <th className="py-4 px-4">Officer Recommendation</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredLoans.map((loan) => {
                  const docs = loan.documents || [];
                  const allDocsVerified = docs.length > 0 && docs.every(d => d.verificationStatus === 'VERIFIED');
                  const hasUnverifiedDocs = docs.some(d => d.verificationStatus === 'PENDING');
                  const hasRecommendation = loan.officerRecommendation && loan.officerRecommendation !== 'NONE';

                  // Determine contextual action button label
                  let actionLabel = "Inspect";
                  let actionIcon = <Eye className="h-3.5 w-3.5" />;
                  let actionClass = "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";

                  if (hasUnverifiedDocs || loan.status === 'DOCUMENT VERIFICATION' || loan.status === 'PENDING') {
                    actionLabel = "Verify Docs";
                    actionIcon = <FileCheck className="h-3.5 w-3.5 text-amber-400" />;
                    actionClass = "bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60";
                  } else if (allDocsVerified && !hasRecommendation) {
                    actionLabel = "Recommend";
                    actionIcon = <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />;
                    actionClass = "bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border-teal-800/60";
                  } else if (loan.status === 'ACTIVE') {
                    actionLabel = "Monitor EMI";
                    actionIcon = <TrendingDown className="h-3.5 w-3.5 text-blue-400" />;
                    actionClass = "bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-800/60";
                  }

                  return (
                    <tr key={loan._id} className="hover:bg-slate-850/50 transition">
                      
                      {/* Loan ID */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white font-mono text-xs">{loan.loanId}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Farmer Name & Contact */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-100">{loan.farmerId?.name || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{loan.farmerId?.mobile}</div>
                        <div className="text-[11px] text-slate-500">{loan.farmerId?.village}</div>
                      </td>

                      {/* Crop & Purpose */}
                      <td className="py-4 px-4 text-xs">
                        <div className="font-medium text-slate-200">{loan.farmerId?.primaryCrop || 'Mixed'}</div>
                        <div className="text-slate-400">{loan.purpose}</div>
                        <div className="text-[11px] text-slate-500">{loan.duration} mos</div>
                      </td>

                      {/* Amount Requested */}
                      <td className="py-4 px-4 font-bold text-white text-sm whitespace-nowrap">
                        ₹{loan.loanAmount?.toLocaleString()}
                        <div className="text-[11px] font-normal text-slate-400">@ {loan.interestRate}%</div>
                      </td>

                      {/* Assigned Officer */}
                      <td className="py-4 px-4 text-xs">
                        {loan.assignedOfficer ? (
                          <div>
                            <span className="font-medium text-indigo-300">{loan.assignedOfficer.name}</span>
                            <div className="text-[10px] text-slate-500">Assigned</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Documents Status */}
                      <td className="py-4 px-4">
                        {getDocumentStatus(loan)}
                      </td>

                      {/* Decision Support Assessment */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            loan.riskLevel === 'LOW' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                            loan.riskLevel === 'MEDIUM' ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-800/40' :
                            loan.riskLevel === 'HIGH' ? 'bg-orange-950/60 text-orange-400 border border-orange-800/40' : 
                            'bg-red-950/60 text-red-400 border border-red-800/40'
                          }`}>
                            {loan.riskLevel}
                          </span>
                          <span className="text-slate-300 font-medium">Risk: {loan.riskScore}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Eligibility: <strong className="text-slate-200">{loan.eligibilityScore || 0}/100</strong>
                        </div>
                      </td>

                      {/* Officer Recommendation */}
                      <td className="py-4 px-4">
                        {getRecommendationBadge(loan.officerRecommendation)}
                        {loan.officerRecommendationRemarks && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                            "{loan.officerRecommendationRemarks}"
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(loan.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/loans/${loan._id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm ${actionClass}`}
                        >
                          {actionIcon}
                          <span>{actionLabel}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OfficerDashboard;
