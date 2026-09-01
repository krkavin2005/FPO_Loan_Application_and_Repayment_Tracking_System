import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FileSignature, 
  Leaf, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Upload,
  Coins,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const LoanApplicationForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    requestedAmount: '',
    purpose: 'Seeds',
    duration: '12',
    crop: user?.farmerProfile?.primaryCrop || 'Paddy',
    landArea: user?.farmerProfile?.landArea || '',
    expectedYield: '',
    estimatedIncome: user?.farmerProfile?.annualIncome || '',
  });

  // Files State
  const [idFile, setIdFile] = useState(null);
  const [landFile, setLandFile] = useState(null);
  const [incomeFile, setIncomeFile] = useState(null);

  // Response summary State
  const [createdLoan, setCreatedLoan] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File sizes must be less than 5MB.');
        return;
      }
      setErrorMsg('');
      if (fileType === 'id') setIdFile(file);
      if (fileType === 'land') setLandFile(file);
      if (fileType === 'income') setIncomeFile(file);
    }
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.requestedAmount || Number(formData.requestedAmount) <= 0) {
        setErrorMsg('Please specify a valid requested amount.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.landArea || !formData.estimatedIncome) {
        setErrorMsg('Please complete all agricultural asset inputs.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setStep((prev) => prev - 1);
  };

  const uploadFile = async (loanId, file, typeStr) => {
    const data = new FormData();
    data.append('loanId', loanId);
    data.append('documentType', typeStr);
    data.append('file', file);
    return axios.post('/documents', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Submit loan details
      const response = await axios.post('/loans', formData);
      const { loan, factors, recommendedMin, recommendedMax } = response.data;
      setCreatedLoan(loan);
      setEligibilityData({ factors, recommendedMin, recommendedMax });

      // 2. Upload documents if provided
      if (idFile) await uploadFile(loan._id, idFile, 'Identity Proof');
      if (landFile) await uploadFile(loan._id, landFile, 'Land Document');
      if (incomeFile) await uploadFile(loan._id, incomeFile, 'Income Proof');

      setStep(4);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Failed to submit loan request. Ensure you do not have other active requests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <FileSignature className="h-6 w-6 text-emerald-400" />
          <span>New Agricultural Loan Application</span>
        </h2>
        <p className="text-sm text-slate-400">
          Complete the multi-step request form, state your cultivating crop purposes, and upload validation proofs.
        </p>
      </div>

      {/* Progress Wizard Tracker */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 text-xs font-semibold text-slate-400">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-emerald-400' : ''}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800'}`}>1</span>
          <span className="hidden sm:inline">Loan Parameters</span>
        </div>
        <div className="h-px bg-slate-850 flex-1 mx-4" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-emerald-400' : ''}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800'}`}>2</span>
          <span className="hidden sm:inline">Agricultural Details</span>
        </div>
        <div className="h-px bg-slate-850 flex-1 mx-4" />
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-emerald-400' : ''}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800'}`}>3</span>
          <span className="hidden sm:inline">Submit Proofs</span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-950/30 border border-red-900 text-red-400 p-3 rounded-lg text-sm mb-6 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
        
        {step === 1 && (
          /* Step 1: Loan Details */
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <span>Step 1: Lending Amount & Repayment Duration</span>
            </h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase">Requested Capital Amount (₹) *</label>
              <input
                type="number"
                name="requestedAmount"
                required
                value={formData.requestedAmount}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                placeholder="e.g. 80000"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum credit ranges are dynamically calculated based on FPO health rules.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase">Amortization Duration (Months) *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="6">6 Months (Short Crop Cycle)</option>
                  <option value="12">12 Months (Standard Amortization)</option>
                  <option value="18">18 Months (Medium Term Equipment)</option>
                  <option value="24">24 Months (Long Term Asset)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase">Lending Purpose *</label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Seeds">Seeds Purchase</option>
                  <option value="Fertilizer">Fertilizer & Chemicals</option>
                  <option value="Equipment">Farm Equipment / Machinery</option>
                  <option value="Irrigation">Irrigation Installation</option>
                  <option value="Livestock">Livestock Breeding</option>
                  <option value="Crop cultivation">General Crop Cultivation</option>
                  <option value="Other">Other Agricultural Capital</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          /* Step 2: Agrarian Details */
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-emerald-400" />
              <span>Step 2: Cultivation Yield Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-450 mb-1.5">Cultivating Crop *</label>
                <input
                  type="text"
                  name="crop"
                  required
                  value={formData.crop}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-450 mb-1.5">Cultivable Land Area (Acres) *</label>
                <input
                  type="number"
                  step="any"
                  name="landArea"
                  required
                  value={formData.landArea}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-450 mb-1.5">Expected Crop Yield (Tons) *</label>
                <input
                  type="number"
                  step="any"
                  name="expectedYield"
                  required
                  value={formData.expectedYield}
                  placeholder="e.g. 12"
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-450 mb-1.5">Estimated Annual Farm Income (₹) *</label>
                <input
                  type="number"
                  name="estimatedIncome"
                  required
                  value={formData.estimatedIncome}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          /* Step 3: Document Uploads */
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span>Step 3: Upload Validation Proofs</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Please submit scanned copies of your official documents. The FPO verifies land registry listings and Aadhaar identity matches prior to loan disbursement. Only PDF, JPG, JPEG, and PNG formats under 5MB are accepted.
            </p>

            <div className="space-y-4">
              {/* Doc 1 */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Aadhaar / Government ID Proof *</span>
                  <span className="text-[10px] text-slate-500 block">Required for KYC checks</span>
                  {idFile && <span className="text-xs text-emerald-400 font-semibold mt-1 block">✓ {idFile.name}</span>}
                </div>
                <label className="mt-2 sm:mt-0 flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose File</span>
                  <input type="file" required onChange={(e) => handleFileChange(e, 'id')} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>

              {/* Doc 2 */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Land Title Registry Document *</span>
                  <span className="text-[10px] text-slate-500 block">Required to verify acreage claims</span>
                  {landFile && <span className="text-xs text-emerald-400 font-semibold mt-1 block">✓ {landFile.name}</span>}
                </div>
                <label className="mt-2 sm:mt-0 flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose File</span>
                  <input type="file" required onChange={(e) => handleFileChange(e, 'land')} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>

              {/* Doc 3 */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Crop Income Certificate (Optional)</span>
                  <span className="text-[10px] text-slate-500 block">Boosts credit eligibility assessment score</span>
                  {incomeFile && <span className="text-xs text-emerald-400 font-semibold mt-1 block">✓ {incomeFile.name}</span>}
                </div>
                <label className="mt-2 sm:mt-0 flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose File</span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'income')} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={loading || !idFile || !landFile}
                className="flex items-center space-x-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 text-white font-bold text-sm rounded-lg transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting Application...' : 'Submit to FPO'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 4 && createdLoan && (
          /* Step 4: Submission Success Summary */
          <div className="text-center py-6 space-y-6">
            <div className="h-14 w-14 bg-emerald-950/45 text-emerald-400 border border-emerald-900/60 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Application Submitted Successfully</h3>
              <p className="text-sm text-slate-400">
                Your loan request has been entered into the validation system. Review status: <span className="font-semibold text-emerald-400">PENDING</span>
              </p>
            </div>

            {/* Assessment Panel */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 max-w-md mx-auto text-left space-y-3.5">
              <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 text-slate-400">
                <span>Lending Loan ID</span>
                <span className="font-bold text-slate-200">{createdLoan.loanId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Requested Capital</span>
                <span className="font-bold text-white">₹{createdLoan.loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Default Risk Probability</span>
                <span className={`font-bold ${
                  createdLoan.riskLevel === 'LOW' ? 'text-emerald-400' :
                  createdLoan.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                }`}>{createdLoan.riskScore}% ({createdLoan.riskLevel})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Assessment score</span>
                <span className="font-bold text-indigo-400">{createdLoan.eligibilityScore}/100</span>
              </div>

              {eligibilityData && (
                <div className="pt-2 border-t border-slate-850 space-y-1.5">
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block">Contributing factors:</span>
                  {eligibilityData.factors.map((f, idx) => (
                    <span key={idx} className="text-xs text-slate-400 block">{f}</span>
                  ))}
                  
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block mt-3">Calculated lending recommendation:</span>
                  <span className="text-xs text-emerald-400 font-semibold block">
                    ₹{eligibilityData.recommendedMin.toLocaleString()} – ₹{eligibilityData.recommendedMax.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoanApplicationForm;
