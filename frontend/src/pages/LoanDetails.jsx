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
  History
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

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      const res = await axios.get(`/loans/${id}`);
      setLoan(res.data.loan);
      setRepayments(res.data.repayments);
      setAuditLogs(res.data.auditLogs);
      setFactors(res.data.assessmentFactors || []);
      setRecRange(res.data.recommendedRange || null);

      // Fetch documents upload mapping
      const docRes = await axios.get(`/documents/loan/${id}`);
      setDocuments(docRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch loan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!actionStatus) return;

    try {
      await axios.put(`/loans/${id}/status`, {
        status: actionStatus,
        remarks: actionRemarks
      });
      setActionRemarks('');
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update loan status.');
    }
  };

  const handleDocumentVerify = async (docId, newStatus) => {
    try {
      await axios.put(`/documents/${docId}/status`, { status: newStatus });
      fetchLoanDetails();
    } catch (err) {
      setErrorMsg('Failed to update document status.');
    }
  };

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

  const isOfficerOrAdmin = ['Admin', 'Loan Officer'].includes(user?.role);
  const outstandingDebt = repayments
    .filter(r => r.status !== 'PAID')
    .reduce((sum, r) => sum + r.principal, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900">Active</span>;
      case 'PENDING':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-yellow-950/45 text-yellow-400 border border-yellow-900/50">Pending</span>;
      case 'UNDER REVIEW':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-900">In Review</span>;
      case 'DOCUMENT VERIFIED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-teal-950/40 text-teal-400 border border-teal-900">Docs Verified</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-emerald-900/20 text-emerald-400 border border-emerald-800">Approved</span>;
      case 'CLOSED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-slate-900 text-slate-400 border border-slate-800">Closed</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-red-950/45 text-red-400 border border-red-900">Rejected</span>;
      default:
        return <span className="px-3 py-1 font-bold text-xs rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Back to dashboard */}
      <div>
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Grid: Details Left, Workflows Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Loan Details & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-4 mb-4 gap-2">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-950/50 p-2.5 rounded-lg text-emerald-400 border border-emerald-900/40">
                  <Sprout className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Loan {loan.loanId}</h3>
                  <span className="text-xs text-slate-400">Purpose: {loan.purpose}</span>
                </div>
              </div>
              <div>{getStatusBadge(loan.status)}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-450 uppercase block font-semibold">Requested Amount</span>
                <span className="text-lg font-bold text-white">₹{loan.loanAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-450 uppercase block font-semibold">Duration</span>
                <span className="text-lg font-bold text-slate-200">{loan.duration} Months</span>
              </div>
              <div>
                <span className="text-slate-450 uppercase block font-semibold">Interest Rate</span>
                <span className="text-lg font-bold text-slate-200">{loan.interestRate}% P.A.</span>
              </div>
              <div>
                <span className="text-slate-450 uppercase block font-semibold">Outstanding Principal</span>
                <span className="text-lg font-bold text-emerald-400">₹{outstandingDebt.toLocaleString()}</span>
              </div>
            </div>

            {/* Farmer details for Officers */}
            {isOfficerOrAdmin && (
              <div className="mt-6 pt-5 border-t border-slate-850 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-350 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60">
                <div>
                  <span className="text-slate-450 uppercase block font-semibold mb-0.5">Borrower Farmer</span>
                  <Link to={`/farmers/${loan.farmerId?._id}`} className="text-emerald-400 hover:underline font-bold text-sm block">
                    {loan.farmerId?.name}
                  </Link>
                  <span className="text-[10px] text-slate-500">{loan.farmerId?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-450 uppercase block font-semibold mb-0.5">Village / Geography</span>
                  <span className="font-semibold text-slate-200 block">{loan.farmerId?.village}, {loan.farmerId?.district}</span>
                  <span className="text-[10px] text-slate-500">Lat: {loan.farmerId?.latitude} | Lng: {loan.farmerId?.longitude}</span>
                </div>
                <div>
                  <span className="text-slate-450 uppercase block font-semibold mb-0.5">Agriculture Income</span>
                  <span className="font-semibold text-white block">₹{loan.farmerId?.annualIncome?.toLocaleString()} / Yr</span>
                  <span className="text-[10px] text-slate-500">Land Area: {loan.farmerId?.landArea} acres</span>
                </div>
              </div>
            )}
          </div>

          {/* Repayment EMI Schedule */}
          {repayments.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/60 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">Amortization Repayment Schedule</h4>
              </div>
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
                      {isOfficerOrAdmin && <th className="py-3 px-6 text-right">Actions</th>}
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
                        <td className="py-3.5 px-6">₹{r.remainingBalance.toLocaleString()}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.status === 'PAID' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' :
                            r.status === 'OVERDUE' ? 'bg-red-950/40 text-red-400 border border-red-900/60' :
                            r.status === 'DUE' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/60' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        {isOfficerOrAdmin && (
                          <td className="py-3 px-6 text-right">
                            {r.status !== 'PAID' && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED') && (
                              <button
                                onClick={() => handleRecordPayment(r._id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded hover:shadow-md transition text-[10px]"
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
            </div>
          )}

          {/* Audit Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center space-x-2">
              <History className="h-4.5 w-4.5 text-emerald-400" />
              <span>Application Audit History</span>
            </h4>
            <div className="space-y-4 relative border-l border-slate-800 pl-4 ml-2">
              {auditLogs.map((log) => (
                <div key={log._id} className="relative text-xs">
                  {/* Indicator circle */}
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                  <div className="flex items-center space-x-2 text-slate-450 font-medium">
                    <span>{log.userId?.name} ({log.userId?.role})</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-200 mt-1 font-semibold">{log.action}: {log.remarks}</div>
                  {log.previousStatus && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Transition: {log.previousStatus} ➜ {log.newStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Assessor & Approval Workflows */}
        <div className="space-y-6">
          
          {/* Assessor / Recommendation Engine (Admin/Officer ONLY) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-850">
              <Coins className="h-4.5 w-4.5 text-emerald-400" />
              <span>Default Risk Assessment</span>
            </h4>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Risk Assessment score</span>
                <span className="text-xl font-bold text-indigo-400">{loan.eligibilityScore}/100</span>
              </div>
              
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Default Probability</span>
                <span className={`text-xl font-extrabold ${
                  loan.riskLevel === 'LOW' ? 'text-emerald-400' :
                  loan.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                  loan.riskLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
                }`}>{loan.riskScore}%</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Risk Assessment Level</span>
                <span className={`text-xs font-bold uppercase ${
                  loan.riskLevel === 'LOW' ? 'text-emerald-400' :
                  loan.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-450'
                }`}>{loan.riskLevel}</span>
              </div>

              {recRange && (
                <div className="pt-2 border-t border-slate-850 text-xs">
                  <span className="text-[10px] text-slate-450 block uppercase font-bold mb-1">Recommended Borrow Range:</span>
                  <span className="font-bold text-white">₹{recRange.min.toLocaleString()} – ₹{recRange.max.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Assessment Factors */}
            <div className="text-xs space-y-2">
              <span className="text-[10px] text-slate-450 font-bold block uppercase">Key Risk Indicators:</span>
              {factors.length === 0 ? (
                <span className="text-slate-500 italic block">No active scoring logs recorded</span>
              ) : (
                factors.map((f, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-slate-350">
                    <span className="mt-0.5">•</span>
                    <span>{f}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="text-[10px] text-slate-500 italic leading-relaxed">
              * Assessment calculations are system-generated estimates. Final credit approval decisions remain with FPO officers.
            </div>
          </div>

          {/* Status Workflow Action Panel */}
          {isOfficerOrAdmin && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-850">
                <CheckSquare className="h-4.5 w-4.5 text-emerald-400" />
                <span>Advance Loan Status</span>
              </h4>

              <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Transition Status *</label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="">Select Target Status...</option>
                    {user.role === 'Loan Officer' ? (
                      <>
                        <option value="UNDER REVIEW">UNDER REVIEW</option>
                        <option value="DOCUMENT VERIFIED">DOCUMENT VERIFIED</option>
                        <option value="REJECTED">REJECTED (Recommend)</option>
                      </>
                    ) : (
                      <>
                        <option value="UNDER REVIEW">UNDER REVIEW</option>
                        <option value="DOCUMENT VERIFIED">DOCUMENT VERIFIED</option>
                        <option value="APPROVED">APPROVED (Commit approval)</option>
                        <option value="DISBURSED">DISBURSED (Funds Transferred)</option>
                        <option value="REJECTED">REJECTED</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Audit Remarks / Comments *</label>
                  <textarea
                    rows="3"
                    required
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-250 focus:outline-none focus:border-emerald-500"
                    placeholder="Enter audit logs or verification checklist notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  Commit Status Transition
                </button>
              </form>
            </div>
          )}

          {/* Document Verification Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-850">
              <FileText className="h-4.5 w-4.5 text-emerald-400" />
              <span>KYC & Document Proofs</span>
            </h4>

            {documents.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 italic">
                No files uploaded for this loan application yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block">{doc.documentType}</span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">{doc.fileName}</span>
                      </div>
                      <a
                        href={`http://localhost:5000/api/documents/${doc._id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-750 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-850/60 text-[10px]">
                      <span className="text-slate-400">Status:</span>
                      <span className={`font-bold ${
                        doc.verificationStatus === 'VERIFIED' ? 'text-emerald-400' :
                        doc.verificationStatus === 'REJECTED' ? 'text-red-400' : 'text-yellow-450'
                      }`}>{doc.verificationStatus}</span>
                    </div>

                    {isOfficerOrAdmin && doc.verificationStatus === 'PENDING' && (
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => handleDocumentVerify(doc._id, 'VERIFIED')}
                          className="flex-1 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded hover:bg-emerald-950/60 text-[10px] font-semibold transition"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleDocumentVerify(doc._id, 'REJECTED')}
                          className="flex-1 py-1 bg-red-950/40 text-red-400 border border-red-900/60 rounded hover:bg-red-950/60 text-[10px] font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoanDetails;
