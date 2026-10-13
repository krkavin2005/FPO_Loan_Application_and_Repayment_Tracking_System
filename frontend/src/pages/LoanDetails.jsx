import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Sprout, 
  Coins, 
  Calendar, 
  ShieldAlert, 
  FileText, 
  CheckSquare,
  MessageSquare,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  History,
  UserCheck,
  Building2,
  Landmark,
  Clock,
  Send,
  Check,
  X,
  HelpCircle,
  TrendingUp,
  Percent,
  AlertCircle
} from 'lucide-react';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [factors, setFactors] = useState([]);
  const [recRange, setRecRange] = useState(null);
  const [officers, setOfficers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Officer recommendation form state
  const [recChoice, setRecChoice] = useState('RECOMMEND APPROVAL');
  const [recRemarks, setRecRemarks] = useState('');
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  // Admin decision form state
  const [decisionChoice, setDecisionChoice] = useState('APPROVED');
  const [decisionFundingSource, setDecisionFundingSource] = useState('FPO_FUND');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Admin assignment state
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Disbursement state
  const [disburseFundingSource, setDisburseFundingSource] = useState('FPO_FUND');
  const [disburseRemarks, setDisburseRemarks] = useState('');
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setErrorMsg('');
      const res = await axios.get(`/loans/${id}`);
      setLoan(res.data.loan);
      setRepayments(res.data.repayments || []);
      setAuditLogs(res.data.auditLogs || []);
      setFactors(res.data.assessmentFactors || []);
      setRecRange(res.data.recommendedRange || null);
      if (res.data.loan?.fundingSource) {
        setDecisionFundingSource(res.data.loan.fundingSource);
        setDisburseFundingSource(res.data.loan.fundingSource);
      }
      if (res.data.loan?.assignedOfficer?._id) {
        setSelectedOfficerId(res.data.loan.assignedOfficer._id);
      }

      const docRes = await axios.get(`/documents/loan/${id}`);
      setDocuments(docRes.data || []);

      if (user?.role === 'Admin') {
        try {
          const offRes = await axios.get('/loans/officers');
          setOfficers(offRes.data || []);
        } catch (e) {
          console.error('Could not fetch officers:', e);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch loan details.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Admin Assigns Officer
  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId) return;
    setIsAssigning(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`/loans/${id}/assign`, { assignedOfficer: selectedOfficerId });
      setSuccessMsg(res.data.message || 'Officer assigned successfully.');
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign loan officer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 2. Loan Officer Submits Recommendation
  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!recRemarks.trim()) {
      setErrorMsg('Please enter officer remarks for the recommendation.');
      return;
    }
    setIsSubmittingRec(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`/loans/${id}/recommend`, {
        recommendation: recChoice,
        remarks: recRemarks,
      });
      setSuccessMsg(res.data.message || 'Recommendation submitted successfully.');
      setRecRemarks('');
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit recommendation.');
    } finally {
      setIsSubmittingRec(false);
    }
  };

  // 3. Admin Submits Final Decision
  const handleDecision = async (e) => {
    e.preventDefault();
    setIsSubmittingDecision(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`/loans/${id}/decision`, {
        decision: decisionChoice,
        fundingSource: decisionFundingSource,
        remarks: decisionRemarks,
      });
      setSuccessMsg(res.data.message || 'Final FPO decision recorded successfully.');
      setDecisionRemarks('');
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // 4. Admin Records Disbursement
  const handleDisburse = async (e) => {
    e.preventDefault();
    setIsDisbursing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`/loans/${id}/disburse`, {
        fundingSource: disburseFundingSource,
        remarks: disburseRemarks,
      });
      setSuccessMsg(res.data.message || 'Loan disbursement recorded and amortization schedule generated.');
      setShowDisburseModal(false);
      setDisburseRemarks('');
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record disbursement.');
    } finally {
      setIsDisbursing(false);
    }
  };

  // 5. Document Verification (Loan Officer / Admin)
  const handleDocumentVerify = async (docId, newStatus) => {
    try {
      await axios.put(`/documents/${docId}/status`, { status: newStatus });
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg('Failed to update document status.');
    }
  };

  // Download Document with authentication token
  const handleDownloadDocument = async (doc) => {
    try {
      const response = await axios.get(`/documents/${doc._id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: window open with query token
      const token = user?.token;
      if (token) {
        window.open(`http://localhost:5000/api/documents/${doc._id}/download?token=${token}`, '_blank');
      } else {
        setErrorMsg('Failed to download document. Please check authorization.');
      }
    }
  };

  // 6. Record Repayment Payment
  const handleRecordPayment = async (repaymentId) => {
    try {
      await axios.post(`/repayments/${repaymentId}/pay`);
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg('Failed to record repayment payment.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12 text-slate-400 space-y-4">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p>Loan application not found.</p>
        <Link to="/" className="text-emerald-400 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isOfficer = user?.role === 'Loan Officer';
  const isAdmin = user?.role === 'Admin';
  const isFarmer = user?.role === 'Farmer';
  const isOfficerOrAdmin = isOfficer || isAdmin;

  // Unpaid principal sum
  const outstandingDebt = repayments
    .filter((r) => r.status !== 'PAID')
    .reduce((sum, r) => sum + r.principal, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900">Active (Amortizing)</span>;
      case 'DISBURSED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-teal-950/40 text-teal-300 border border-teal-800">Disbursed</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-emerald-900/25 text-emerald-400 border border-emerald-800">Approved by FPO</span>;
      case 'RECOMMENDED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-indigo-950/50 text-indigo-300 border border-indigo-800">Officer Recommended</span>;
      case 'ASSESSMENT COMPLETED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-purple-950/50 text-purple-300 border border-purple-800">Assessment Completed</span>;
      case 'DOCUMENT VERIFIED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-teal-950/40 text-teal-400 border border-teal-900">Docs Verified</span>;
      case 'DOCUMENT VERIFICATION':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-800">Doc Verification</span>;
      case 'UNDER REVIEW':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900">Under Review</span>;
      case 'PENDING':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-yellow-950/45 text-yellow-400 border border-yellow-900/50">Pending Review</span>;
      case 'NEEDS_INFORMATION':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-amber-950/50 text-amber-400 border border-amber-800">Needs Information</span>;
      case 'REPAYMENT MONITORING':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900">Repayment Monitoring</span>;
      case 'CLOSED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed (Settled)</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-red-950/45 text-red-400 border border-red-900">Rejected</span>;
      default:
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const fundingSourceLabel = {
    FPO_FUND: 'FPO Managed Internal Fund',
    PARTNER_BANK: 'Commercial Partner Bank',
    FINANCIAL_INSTITUTION: 'Financial Institution (FI)',
    OTHER: 'Other Authorized Lending Partner',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="text-xs text-slate-500 font-mono">
          System ID: {loan._id}
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-900 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-950/30 border border-red-900 text-red-400 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Banner: Loan ID, Status, Funding Source */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-950/50 p-3.5 rounded-xl text-emerald-400 border border-emerald-900/50 shadow-inner">
            <Sprout className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{loan.loanId}</h2>
              {getStatusBadge(loan.status)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Purpose: <span className="font-semibold text-slate-200">{loan.purpose}</span> | Applied on{' '}
              <span className="text-slate-300">{new Date(loan.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Quick actions for Admin (e.g. record disbursement if approved) */}
        {isAdmin && loan.status === 'APPROVED' && (
          <button
            onClick={() => setShowDisburseModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            <Coins className="h-4 w-4" />
            <span>Record Loan Disbursement</span>
          </button>
        )}
      </div>

      {/* Main 7 Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Sections 1, 2, 6, 7 */}
        <div className="lg:col-span-2 space-y-6">

          {/* ========================================================================= */}
          {/* SECTION 1: APPLICATION INFORMATION */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>1. Application Information</span>
              </h3>
              <span className="text-xs text-slate-500">Credit Reference Data</span>
            </div>

            {/* Basic Loan Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-450 uppercase block font-semibold text-[10px] mb-1">Requested Amount</span>
                <span className="text-base font-bold text-white">₹{loan.loanAmount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-450 uppercase block font-semibold text-[10px] mb-1">Duration</span>
                <span className="text-base font-bold text-slate-200">{loan.duration} Months</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-450 uppercase block font-semibold text-[10px] mb-1">Interest Rate</span>
                <span className="text-base font-bold text-slate-200">{loan.interestRate}% P.A.</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-450 uppercase block font-semibold text-[10px] mb-1">Outstanding Balance</span>
                <span className="text-base font-bold text-emerald-400">₹{outstandingDebt.toLocaleString()}</span>
              </div>
            </div>

            {/* Borrower & Funding Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Applicant Farmer</span>
                <div className="font-bold text-sm text-emerald-400">
                  <Link to={`/farmers/${loan.farmerId?._id}`} className="hover:underline">
                    {loan.farmerId?.name}
                  </Link>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Mobile: {loan.farmerId?.mobile} | Village: {loan.farmerId?.village}, {loan.farmerId?.district}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Aadhaar KYC: {loan.farmerId?.governmentId} | Income: ₹{loan.farmerId?.annualIncome?.toLocaleString()}/yr
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Designated Funding Source</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <Landmark className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-slate-200">
                    {fundingSourceLabel[loan.fundingSource] || loan.fundingSource || 'FPO Managed Internal Fund'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  * Funds originate from this lending partner. AgriLend360 provides digital tracking.
                </p>
              </div>
            </div>

            {/* Officer Assignment Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-850 gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="h-4.5 w-4.5 text-indigo-400" />
                <div>
                  <span className="text-slate-400 font-semibold block">Assigned Loan Officer:</span>
                  <span className="text-slate-200 font-bold">
                    {loan.assignedOfficer ? loan.assignedOfficer.name : 'Unassigned (Awaiting Admin Assignment)'}
                  </span>
                  {loan.assignedAt && (
                    <span className="text-[10px] text-slate-500 ml-2">
                      (Assigned on {new Date(loan.assignedAt).toLocaleDateString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Assignment Dropdown */}
              {isAdmin && (
                <form onSubmit={handleAssignOfficer} className="flex items-center space-x-2">
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Officer...</option>
                    {officers.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.name} ({off.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isAssigning || !selectedOfficerId}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: VERIFICATION */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span>2. Verification (KYC & Documents)</span>
              </h3>
              <span className="text-xs text-slate-500">
                {documents.filter((d) => d.verificationStatus === 'VERIFIED').length}/{documents.length} Proofs Verified
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic bg-slate-950 rounded-xl border border-slate-850">
                No KYC documents uploaded by borrower for this application.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-xs text-slate-200">{doc.documentType}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' :
                          doc.verificationStatus === 'REJECTED' ? 'bg-red-950/40 text-red-400 border border-red-900/60' :
                          'bg-yellow-950/40 text-yellow-400 border border-yellow-900/60'
                        }`}>
                          {doc.verificationStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Filename: <span className="font-mono text-slate-300">{doc.fileName}</span> | Uploaded: {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-750 text-xs font-semibold transition cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Download</span>
                      </button>

                      {/* Verify / Reject buttons for Loan Officer and Admin */}
                      {isOfficerOrAdmin && doc.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleDocumentVerify(doc._id, 'VERIFIED')}
                          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-600/40 rounded-lg text-xs font-semibold transition"
                        >
                          Verify
                        </button>
                      )}
                      {isOfficerOrAdmin && doc.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleDocumentVerify(doc._id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-800/60 hover:bg-red-600/40 rounded-lg text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 6: REPAYMENT */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  6. Repayment Schedule & Amortization
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {repayments.filter((r) => r.status === 'PAID').length}/{repayments.length} EMIs Settled
              </span>
            </div>

            {repayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                {loan.status === 'APPROVED' ? (
                  <span>Loan is approved. Amortization schedule will generate upon recording disbursement.</span>
                ) : (
                  <span>No repayment schedule generated yet. Active only upon approval and disbursement recording.</span>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 font-semibold text-slate-450 uppercase tracking-wider">
                      <th className="py-3 px-6">Installment</th>
                      <th className="py-3 px-6">Due Date</th>
                      <th className="py-3 px-6">EMI Amount</th>
                      <th className="py-3 px-6">Principal</th>
                      <th className="py-3 px-6">Interest</th>
                      <th className="py-3 px-6">Remaining Balance</th>
                      <th className="py-3 px-6">Status</th>
                      {isOfficerOrAdmin && <th className="py-3 px-6 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-350">
                    {repayments.map((r, idx) => (
                      <tr key={r._id} className={`hover:bg-slate-850/30 transition ${r.status === 'OVERDUE' ? 'bg-red-950/10' : ''}`}>
                        <td className="py-3.5 px-6 font-bold text-slate-200"># {idx + 1}</td>
                        <td className="py-3.5 px-6">{new Date(r.dueDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-6 font-bold text-white">₹{r.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-6">₹{r.principal.toLocaleString()}</td>
                        <td className="py-3.5 px-6">₹{r.interest.toLocaleString()}</td>
                        <td className="py-3.5 px-6 font-mono">₹{r.remainingBalance.toLocaleString()}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.status === 'PAID' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' :
                            r.status === 'OVERDUE' ? 'bg-red-950/40 text-red-400 border border-red-900/60' :
                            r.status === 'DUE' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/60' : 
                            'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        {isOfficerOrAdmin && (
                          <td className="py-3 px-6 text-right">
                            {r.status !== 'PAID' && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED') && (
                              <button
                                onClick={() => handleRecordPayment(r._id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition"
                              >
                                Record Pay
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: AUDIT TIMELINE */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center space-x-2">
              <History className="h-4.5 w-4.5 text-emerald-400" />
              <span>7. Application Audit History Timeline</span>
            </h4>
            
            {auditLogs.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No audit events recorded yet.</div>
            ) : (
              <div className="space-y-4 relative border-l border-slate-800 pl-4 ml-2">
                {auditLogs.map((log) => (
                  <div key={log._id} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                    <div className="flex items-center space-x-2 text-slate-450 font-medium">
                      <span className="font-semibold text-slate-300">{log.userId?.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">({log.userId?.role})</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-200 mt-1 font-semibold">
                      <span className="text-emerald-400 uppercase font-mono text-[10px] mr-1.5">{log.action}:</span>
                      {log.remarks}
                    </div>
                    {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Status Transition: <span className="font-mono text-slate-400">{log.previousStatus}</span> ➔ <span className="font-mono text-emerald-400">{log.newStatus}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Sections 3, 4, 5 */}
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* SECTION 3: DECISION-SUPPORT ASSESSMENT */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Coins className="h-4.5 w-4.5 text-emerald-400" />
                <span>3. Decision-Support Assessment</span>
              </h4>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Eligibility Assessment Score</span>
                <span className="text-xl font-bold text-indigo-400">{loan.eligibilityScore}/100</span>
              </div>
              
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Default Risk Probability</span>
                <span className={`text-xl font-extrabold ${
                  loan.riskLevel === 'LOW' ? 'text-emerald-400' :
                  loan.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                  loan.riskLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
                }`}>{loan.riskScore}%</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Risk Assessment Level</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  loan.riskLevel === 'LOW' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' :
                  loan.riskLevel === 'MEDIUM' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/60' : 
                  'bg-red-950/40 text-red-400 border border-red-900/60'
                }`}>{loan.riskLevel}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Farmer Credit Health Score</span>
                <span className="text-base font-bold text-white">
                  {loan.farmerId?.financialHealthScore || 60}/100
                </span>
              </div>

              {recRange && (
                <div className="pt-2 border-t border-slate-850 text-xs">
                  <span className="text-[10px] text-slate-450 block uppercase font-bold mb-0.5">Recommended Borrow Range:</span>
                  <span className="font-bold text-white">₹{recRange.min.toLocaleString()} – ₹{recRange.max.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Contributing factors */}
            <div className="text-xs space-y-2">
              <span className="text-[10px] text-slate-450 font-bold block uppercase">Key Contributing Factors:</span>
              {factors.length === 0 ? (
                <span className="text-slate-500 italic block">No active scoring logs recorded</span>
              ) : (
                factors.map((f, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-slate-350">
                    <span className="mt-0.5 text-emerald-400">•</span>
                    <span>{f}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="text-[10px] text-slate-500 italic leading-relaxed border-t border-slate-850 pt-3">
              * System-generated assessment for decision support. It does not constitute automatic approval. Final lending authority remains with authorized FPO management.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: LOAN OFFICER RECOMMENDATION */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="h-4.5 w-4.5 text-indigo-400" />
                <span>4. Loan Officer Recommendation</span>
              </h4>
              <span className="text-xs text-slate-500">Advisory Review</span>
            </div>

            {/* Recommendation Record Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Officer Recommendation:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  loan.officerRecommendation === 'RECOMMEND APPROVAL' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                  loan.officerRecommendation === 'RECOMMEND REJECTION' ? 'bg-red-950/40 text-red-400 border border-red-900' :
                  loan.officerRecommendation === 'NEEDS ADDITIONAL INFORMATION' ? 'bg-amber-950/40 text-amber-400 border border-amber-900' :
                  'bg-slate-900 text-slate-400'
                }`}>
                  {loan.officerRecommendation || 'NONE (Pending)'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Recommended By:</span>
                <span className="font-semibold text-slate-200">
                  {loan.recommendedBy?.name || loan.assignedOfficer?.name || 'Awaiting Officer'}
                </span>
              </div>

              {loan.recommendedAt && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Recommendation Date:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(loan.recommendedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Show remarks to Loan Officer and Admin, hide confidential notes from Farmer */}
              {!isFarmer && loan.officerRecommendationRemarks && (
                <div className="pt-2 border-t border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Officer Remarks:</span>
                  <p className="text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    "{loan.officerRecommendationRemarks}"
                  </p>
                </div>
              )}
            </div>

            {/* Officer Action Form: Only for Assigned Loan Officer */}
            {isOfficer && ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFICATION', 'DOCUMENT VERIFIED', 'ASSESSMENT COMPLETED', 'NEEDS_INFORMATION'].includes(loan.status) && (
              loan.assignedOfficer && (loan.assignedOfficer._id === user?._id || loan.assignedOfficer === user?._id) ? (
                <form onSubmit={handleRecommend} className="space-y-3 pt-2 text-xs">
                  <label className="block text-slate-300 font-semibold uppercase text-[10px]">
                    Submit Formal Recommendation *
                  </label>
                  <select
                    value={recChoice}
                    onChange={(e) => setRecChoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="RECOMMEND APPROVAL">RECOMMEND APPROVAL</option>
                    <option value="RECOMMEND REJECTION">RECOMMEND REJECTION</option>
                    <option value="NEEDS ADDITIONAL INFORMATION">NEEDS ADDITIONAL INFORMATION</option>
                  </select>

                  <textarea
                    rows="3"
                    required
                    value={recRemarks}
                    onChange={(e) => setRecRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    placeholder="Detail verification remarks, yield checks, and rationale..."
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingRec}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition"
                  >
                    {isSubmittingRec ? 'Submitting Recommendation...' : 'Submit Recommendation to Admin'}
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
                  <span className="text-yellow-400 font-semibold">Caseload Assignment: </span>
                  {loan.assignedOfficer 
                    ? `This application is assigned to Loan Officer ${loan.assignedOfficer.name || 'another officer'}. Only the assigned officer may submit recommendations.` 
                    : 'This application is currently unassigned. An Administrator must assign a Loan Officer before recommendations can be submitted.'}
                </div>
              )
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: FINAL FPO DECISION */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="h-4.5 w-4.5 text-amber-400" />
                <span>5. Final FPO Decision</span>
              </h4>
              <span className="text-xs text-slate-500">Approving Authority</span>
            </div>

            {/* Decision Record Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Final Decision:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                  loan.finalDecision === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                  loan.finalDecision === 'REJECTED' ? 'bg-red-950/40 text-red-400 border border-red-900' :
                  loan.finalDecision === 'NEEDS_INFORMATION' ? 'bg-amber-950/40 text-amber-400 border border-amber-900' :
                  'bg-slate-900 text-slate-400'
                }`}>
                  {loan.finalDecision || 'PENDING'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Authorized Approver:</span>
                <span className="font-semibold text-slate-200">
                  {loan.approvedBy ? loan.approvedBy.name : (loan.finalDecision === 'APPROVED' ? 'Authorized FPO Management' : 'Pending Review')}
                </span>
              </div>

              {loan.approvedAt && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Decision Date:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(loan.approvedAt).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400">
                <span>Funding Source:</span>
                <span className="font-semibold text-amber-300">
                  {fundingSourceLabel[loan.fundingSource] || loan.fundingSource}
                </span>
              </div>

              {loan.finalDecisionRemarks && (
                <div className="pt-2 border-t border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Decision Remarks:</span>
                  <p className="text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    "{loan.finalDecisionRemarks}"
                  </p>
                </div>
              )}
            </div>

            {/* Admin Decision Form */}
            {isAdmin && !['ACTIVE', 'CLOSED'].includes(loan.status) && (
              <form onSubmit={handleDecision} className="space-y-3 pt-2 text-xs">
                <label className="block text-slate-300 font-semibold uppercase text-[10px]">
                  Authorized Lending Decision *
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('APPROVED')}
                    className={`py-2 rounded-lg font-bold text-center border transition ${
                      decisionChoice === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('REJECTED')}
                    className={`py-2 rounded-lg font-bold text-center border transition ${
                      decisionChoice === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('NEEDS_INFORMATION')}
                    className={`py-2 rounded-lg font-bold text-center border transition ${
                      decisionChoice === 'NEEDS_INFORMATION'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Needs Info
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-semibold mb-1 uppercase">
                    Select Funding Source *
                  </label>
                  <select
                    value={decisionFundingSource}
                    onChange={(e) => setDecisionFundingSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FPO_FUND">FPO Managed Internal Fund</option>
                    <option value="PARTNER_BANK">Commercial Partner Bank</option>
                    <option value="FINANCIAL_INSTITUTION">Financial Institution (FI)</option>
                    <option value="OTHER">Other Authorized Lending Source</option>
                  </select>
                </div>

                <textarea
                  rows="2"
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Enter decision rationale or conditions for approval/rejection..."
                />

                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition"
                >
                  {isSubmittingDecision ? 'Recording Decision...' : 'Commit FPO Final Decision'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* DISBURSEMENT RECORDING MODAL (Admin Only) */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Loan Disbursement</h3>
              </div>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Borrower:</span>
                  <span className="font-bold text-white">{loan.farmerId?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approved Loan Amount:</span>
                  <span className="font-bold text-emerald-400 text-sm">₹{loan.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amortization Period:</span>
                  <span className="font-semibold text-slate-200">{loan.duration} Months ({loan.interestRate}% P.A.)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase text-[10px]">
                  Funding Source (Release of Funds) *
                </label>
                <select
                  value={disburseFundingSource}
                  onChange={(e) => setDisburseFundingSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="FPO_FUND">FPO Managed Internal Fund</option>
                  <option value="PARTNER_BANK">Commercial Partner Bank</option>
                  <option value="FINANCIAL_INSTITUTION">Financial Institution (FI)</option>
                  <option value="OTHER">Other Authorized Lending Source</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase text-[10px]">
                  Disbursement Remarks & Transaction Reference
                </label>
                <textarea
                  rows="2"
                  value={disburseRemarks}
                  onChange={(e) => setDisburseRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Disbursed via Bank NEFT Ref #99281 to farmer account."
                />
              </div>

              <div className="text-[10px] text-slate-500 italic leading-relaxed">
                * AgriLend360 records the release of funds and generates the Amortization Repayment Schedule. It does not transfer actual money.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisbursing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold shadow-lg"
                >
                  {isDisbursing ? 'Recording...' : 'Confirm Disbursement Recording'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoanDetails;
