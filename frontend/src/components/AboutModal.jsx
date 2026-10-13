import React from 'react';
import { X, ShieldCheck, Landmark, Building2, Users, ArrowDown, Info } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">About AgriLend360</h3>
              <p className="text-xs text-slate-400">Platform Definition & Operating Concept</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs text-slate-350 leading-relaxed max-h-[75vh] overflow-y-auto pr-1">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
            <p className="text-slate-200 text-sm font-semibold">
              AgriLend360 is a digital credit-management and risk analytics platform designed to help Farmer Producer Organizations (FPOs) manage the complete farmer loan lifecycle.
            </p>
            <p className="text-slate-400">
              The platform supports farmer registration, loan applications, document verification, eligibility assessment, risk analysis, approval workflows, repayment monitoring, financial profiling, and portfolio analytics.
            </p>
            <p className="text-emerald-400/90 font-medium">
              AgriLend360 does not itself provide or lend money. Actual lending is carried out by the FPO or its authorized lending/financial partner.
            </p>
          </div>

          {/* Conceptual Model Flowchart */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
              Real-World System Model
            </span>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              {/* Box 1: Lending Source */}
              <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center space-x-2.5">
                  <Landmark className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">Funding Source</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  FPO Managed Fund / Partner Bank / Financial Institution
                </span>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className="h-4 w-4" />
              </div>

              {/* Box 2: FPO */}
              <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center space-x-2.5">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Farmer Producer Organization (FPO)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Authorized Approving Authority & Decision Maker
                </span>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className="h-4 w-4" />
              </div>

              {/* Box 3: AgriLend360 */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white">AgriLend360 Digital Platform</span>
                </div>
                <span className="text-[11px] text-emerald-300 font-medium">
                  Credit Management, Risk Scoring & Decision Support
                </span>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className="h-4 w-4" />
              </div>

              {/* Box 4: Farmer */}
              <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center space-x-2.5">
                  <Users className="h-4 w-4 text-teal-400" />
                  <span className="font-semibold text-slate-200">Borrower Farmer</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Application, Document Submission & Repayments
                </span>
              </div>
            </div>
          </div>

          {/* Key Principles Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
            <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Decision Support:</strong> AI scores and eligibility indicators assist human FPO loan officers and admins.</span>
            </div>
            <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Separation of Powers:</strong> Loan Officers verify & recommend; Authorized Admins make the final lending decision.</span>
            </div>
            <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Funding Sources:</strong> Tracks capital originating from FPO Funds, Partner Banks, or Financial Institutions.</span>
            </div>
            <div className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Traceable Audit Trail:</strong> Every action from submission to closure is cryptographically timestamped.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
