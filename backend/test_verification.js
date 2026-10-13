import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

import User from './models/User.js';
import Farmer from './models/Farmer.js';
import Loan from './models/Loan.js';
import Repayment from './models/Repayment.js';
import Document from './models/Document.js';
import AuditLog from './models/AuditLog.js';
import { calculateFinancialHealthScore } from './services/financialHealth.js';

import loanRoutes from './routes/loans.js';
import documentRoutes from './routes/documents.js';
import repaymentRoutes from './routes/repayments.js';

dotenv.config();

const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const makeToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'agrilend360_super_secure_jwt_token_secret_9988776655',
    { expiresIn: '1d' }
  );
};

const runCompleteVerification = async () => {
  console.log('================================================================');
  console.log('AGRILEND360: TARGETED WORKFLOW & AUTHORIZATION VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrilend360');
  console.log('✓ MongoDB connection active.');

  // Setup express test server
  const app = express();
  app.use(express.json());
  app.use('/api/loans', loanRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/repayments', repaymentRoutes);

  const server = app.listen(PORT);
  console.log(`✓ Test API server listening on ephemeral port ${PORT}.`);

  try {
    // 1. Fetch Users
    const admin = await User.findOne({ email: 'admin@agrilend360.com' });
    const officer1 = await User.findOne({ email: 'officer@agrilend360.com' });
    let officer2 = await User.findOne({ email: 'officer2@agrilend360.com' });
    if (!officer2) {
      officer2 = await User.create({
        name: 'Sunita Rao',
        email: 'officer2@agrilend360.com',
        password: 'password123',
        role: 'Loan Officer',
      });
    }
    const farmerUser = await User.findOne({ email: 'farmer@agrilend360.com' });
    const farmer = await Farmer.findOne({ userId: farmerUser._id });

    if (!admin || !officer1 || !officer2 || !farmerUser || !farmer) {
      throw new Error('Required test users or farmer profile not found in database.');
    }

    const adminToken = makeToken(admin);
    const officer1Token = makeToken(officer1);
    const officer2Token = makeToken(officer2);
    const farmerToken = makeToken(farmerUser);

    console.log(`✓ Test Users Ready: Admin (${admin.name}), Officer 1 (${officer1.name}), Officer 2 (${officer2.name}), Farmer (${farmer.name})\n`);

    // =========================================================================
    // PART A: AUTHORIZATION TESTS (HTTP 403 ENFORCEMENT)
    // =========================================================================
    console.log('--- PART A: Role-Based Authorization & Permission Tests ---');

    // Create a temporary loan assigned to officer1 in UNDER REVIEW status
    const authTestLoan = await Loan.create({
      loanId: `AUTH-TEST-${Date.now().toString().slice(-4)}`,
      farmerId: farmer._id,
      loanAmount: 50000,
      purpose: 'Seeds',
      duration: 12,
      interestRate: 8.5,
      status: 'UNDER REVIEW',
      riskScore: 25,
      riskLevel: 'LOW',
      eligibilityScore: 75,
      fundingSource: 'FPO_FUND',
      assignedOfficer: officer1._id,
      assignedAt: new Date(),
    });

    const headersFor = (token) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });

    // 1. Farmer attempts /api/loans/:id/recommend -> 403
    const res1 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/recommend`, {
      method: 'POST',
      headers: headersFor(farmerToken),
      body: JSON.stringify({ recommendation: 'RECOMMEND APPROVAL', remarks: 'Farmer self recommendation' }),
    });
    if (res1.status !== 403) throw new Error(`Test 1 Failed: Expected 403, got ${res1.status}`);
    console.log('✓ Test 1: Farmer attempts /api/loans/:id/recommend → HTTP 403 (Denied)');

    // 2. Farmer attempts /api/loans/:id/decision -> 403
    const res2 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/decision`, {
      method: 'POST',
      headers: headersFor(farmerToken),
      body: JSON.stringify({ decision: 'APPROVED', remarks: 'Self approval' }),
    });
    if (res2.status !== 403) throw new Error(`Test 2 Failed: Expected 403, got ${res2.status}`);
    console.log('✓ Test 2: Farmer attempts /api/loans/:id/decision → HTTP 403 (Denied)');

    // 3. Farmer attempts /api/loans/:id/disburse -> 403
    const res3 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/disburse`, {
      method: 'POST',
      headers: headersFor(farmerToken),
      body: JSON.stringify({ remarks: 'Self disburse' }),
    });
    if (res3.status !== 403) throw new Error(`Test 3 Failed: Expected 403, got ${res3.status}`);
    console.log('✓ Test 3: Farmer attempts /api/loans/:id/disburse → HTTP 403 (Denied)');

    // 4. Loan Officer attempts /api/loans/:id/decision -> 403
    const res4 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/decision`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ decision: 'APPROVED', remarks: 'Officer trying decision' }),
    });
    if (res4.status !== 403) throw new Error(`Test 4 Failed: Expected 403, got ${res4.status}`);
    console.log('✓ Test 4: Loan Officer attempts /api/loans/:id/decision → HTTP 403 (Denied)');

    // 5. Loan Officer attempts /api/loans/:id/disburse -> 403
    const res5 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/disburse`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ remarks: 'Officer trying disburse' }),
    });
    if (res5.status !== 403) throw new Error(`Test 5 Failed: Expected 403, got ${res5.status}`);
    console.log('✓ Test 5: Loan Officer attempts /api/loans/:id/disburse → HTTP 403 (Denied)');

    // 6. Admin attempts /api/loans/:id/recommend -> 403
    const res6 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/recommend`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ recommendation: 'RECOMMEND APPROVAL', remarks: 'Admin trying recommend' }),
    });
    if (res6.status !== 403) throw new Error(`Test 6 Failed: Expected 403, got ${res6.status}`);
    console.log('✓ Test 6: Admin attempts /api/loans/:id/recommend → HTTP 403 (Denied)');

    // 7. Unassigned Loan Officer (Officer 2) attempts /api/loans/:id/recommend -> 403
    const res7 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/recommend`, {
      method: 'POST',
      headers: headersFor(officer2Token),
      body: JSON.stringify({ recommendation: 'RECOMMEND APPROVAL', remarks: 'Unassigned officer trying recommend' }),
    });
    if (res7.status !== 403) throw new Error(`Test 7 Failed: Expected 403, got ${res7.status}`);
    console.log('✓ Test 7: Unassigned Loan Officer attempts /api/loans/:id/recommend → HTTP 403 (Denied)');

    // 8. Assigned Loan Officer (Officer 1) submits recommendation -> 200
    const res8 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/recommend`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ recommendation: 'RECOMMEND APPROVAL', remarks: 'Assigned officer recommendation' }),
    });
    if (res8.status !== 200) throw new Error(`Test 8 Failed: Expected 200, got ${res8.status}`);
    console.log('✓ Test 8: Assigned Loan Officer submits recommendation → HTTP 200 (Allowed)');

    // 9. Admin submits final decision -> 200
    const res9 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/decision`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ decision: 'APPROVED', remarks: 'Committee approval', fundingSource: 'FPO_FUND' }),
    });
    if (res9.status !== 200) throw new Error(`Test 9 Failed: Expected 200, got ${res9.status}`);
    console.log('✓ Test 9: Admin submits final decision → HTTP 200 (Allowed)');

    // 10. Admin records disbursement -> 200
    const res10 = await fetch(`${BASE_URL}/loans/${authTestLoan._id}/disburse`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ remarks: 'Digital disbursement recorded' }),
    });
    if (res10.status !== 200) throw new Error(`Test 10 Failed: Expected 200, got ${res10.status}`);
    console.log('✓ Test 10: Admin records disbursement → HTTP 200 (Allowed)\n');

    // =========================================================================
    // PART B: REJECTION & NEEDS INFORMATION ALTERNATIVE PATHS
    // =========================================================================
    console.log('--- PART B: Alternative Workflow Paths (Rejection & Needs Info) ---');

    // Path 1: Officer recommends NEEDS ADDITIONAL INFORMATION
    const altLoan1 = await Loan.create({
      loanId: `ALT-INFO-${Date.now().toString().slice(-4)}`,
      farmerId: farmer._id,
      loanAmount: 40000,
      purpose: 'Fertilizer',
      duration: 6,
      interestRate: 8.5,
      status: 'ASSESSMENT COMPLETED',
      assignedOfficer: officer1._id,
      fundingSource: 'FPO_FUND',
    });

    const resAltInfo = await fetch(`${BASE_URL}/loans/${altLoan1._id}/recommend`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ recommendation: 'NEEDS ADDITIONAL INFORMATION', remarks: 'Requires updated land title' }),
    });
    const dataAltInfo = await resAltInfo.json();
    if (dataAltInfo.loan.status !== 'NEEDS_INFORMATION') {
      throw new Error(`Expected status NEEDS_INFORMATION, got ${dataAltInfo.loan.status}`);
    }
    console.log('✓ Alternative Path 1: Officer recommends NEEDS ADDITIONAL INFORMATION → Status: NEEDS_INFORMATION');

    // Attempting disbursement on NEEDS_INFORMATION loan must fail with 400
    const resDisburseInfo = await fetch(`${BASE_URL}/loans/${altLoan1._id}/disburse`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ remarks: 'Attempt invalid disburse' }),
    });
    if (resDisburseInfo.status !== 400) throw new Error(`Expected 400 on disburse NEEDS_INFORMATION, got ${resDisburseInfo.status}`);
    console.log('✓ Blocked disbursement on NEEDS_INFORMATION loan → HTTP 400 (Denied)');

    // Path 2: Officer recommends RECOMMEND REJECTION, Admin decides REJECTED
    const altLoan2 = await Loan.create({
      loanId: `ALT-REJ-${Date.now().toString().slice(-4)}`,
      farmerId: farmer._id,
      loanAmount: 90000,
      purpose: 'Equipment',
      duration: 24,
      interestRate: 8.5,
      status: 'ASSESSMENT COMPLETED',
      assignedOfficer: officer1._id,
      fundingSource: 'FPO_FUND',
    });

    const resAltRej = await fetch(`${BASE_URL}/loans/${altLoan2._id}/recommend`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ recommendation: 'RECOMMEND REJECTION', remarks: 'Debt capacity exceeded' }),
    });
    const dataAltRej = await resAltRej.json();
    if (dataAltRej.loan.status !== 'RECOMMENDED') {
      throw new Error(`Expected status RECOMMENDED, got ${dataAltRej.loan.status}`);
    }
    console.log('✓ Alternative Path 2a: Officer recommends RECOMMEND REJECTION → Status: RECOMMENDED');

    const resAdminRej = await fetch(`${BASE_URL}/loans/${altLoan2._id}/decision`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ decision: 'REJECTED', remarks: 'FPO Committee agreed with rejection' }),
    });
    const dataAdminRej = await resAdminRej.json();
    if (dataAdminRej.loan.status !== 'REJECTED') {
      throw new Error(`Expected status REJECTED, got ${dataAdminRej.loan.status}`);
    }
    console.log('✓ Alternative Path 2b: Admin decides REJECTED → Status: REJECTED');

    // Attempting disbursement on REJECTED loan must fail with 400
    const resDisburseRej = await fetch(`${BASE_URL}/loans/${altLoan2._id}/disburse`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ remarks: 'Attempt invalid disburse on rejected loan' }),
    });
    if (resDisburseRej.status !== 400) throw new Error(`Expected 400 on disburse REJECTED, got ${resDisburseRej.status}`);
    console.log('✓ Blocked disbursement on REJECTED loan → HTTP 400 (Denied)\n');

    // =========================================================================
    // PART C: COMPLETE PRIMARY 12-STEP END-TO-END WORKFLOW
    // =========================================================================
    console.log('--- PART C: Full 12-Step Primary Workflow & Audit Trail Verification ---');

    // STEP 1: Loan Application Submitted (PENDING)
    const e2eLoanId = `AL360-E2E-${Date.now().toString().slice(-4)}`;
    const e2eLoan = await Loan.create({
      loanId: e2eLoanId,
      farmerId: farmer._id,
      loanAmount: 60000,
      purpose: 'Seeds',
      duration: 12,
      interestRate: 8.5,
      status: 'PENDING',
      riskScore: 28,
      riskLevel: 'LOW',
      eligibilityScore: 72,
      fundingSource: 'FPO_FUND',
      officerRecommendation: 'NONE',
      finalDecision: 'PENDING',
    });

    await AuditLog.create({
      loanId: e2eLoan._id,
      userId: farmerUser._id,
      action: 'APPLICATION_SUBMITTED',
      previousStatus: 'PENDING',
      newStatus: 'PENDING',
      remarks: 'Farmer submitted loan application for ₹60,000.',
    });
    console.log(`✓ STEP 1: Loan application submitted [${e2eLoan.loanId}] → Status: PENDING`);

    // STEP 2: Documents Uploaded
    const doc1 = await Document.create({
      farmerId: farmer._id,
      loanId: e2eLoan._id,
      documentType: 'Identity Proof',
      fileName: 'aadhaar_proof.pdf',
      filePath: 'uploads/sample_kyc_doc.pdf',
      verificationStatus: 'PENDING',
    });
    const doc2 = await Document.create({
      farmerId: farmer._id,
      loanId: e2eLoan._id,
      documentType: 'Land Document',
      fileName: 'land_patta.pdf',
      filePath: 'uploads/sample_kyc_doc.pdf',
      verificationStatus: 'PENDING',
    });
    console.log('✓ STEP 2: Verification documents uploaded (2 files) → Status: PENDING');

    // STEP 3: Admin Assigns Loan Officer (PENDING → UNDER REVIEW)
    const resAssign = await fetch(`${BASE_URL}/loans/${e2eLoan._id}/assign`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ assignedOfficer: officer1._id }),
    });
    const dataAssign = await resAssign.json();
    if (dataAssign.loan.status !== 'UNDER REVIEW') {
      throw new Error(`Expected UNDER REVIEW, got ${dataAssign.loan.status}`);
    }
    console.log(`✓ STEP 3: Admin assigns Loan Officer (${officer1.name}) → Status: PENDING ➔ UNDER REVIEW`);

    // STEP 4: Officer begins document verification (UNDER REVIEW → DOCUMENT VERIFICATION)
    const resStartVerif = await fetch(`${BASE_URL}/loans/${e2eLoan._id}/start-verification`, {
      method: 'POST',
      headers: headersFor(officer1Token),
    });
    const dataStartVerif = await resStartVerif.json();
    if (dataStartVerif.loan.status !== 'DOCUMENT VERIFICATION') {
      throw new Error(`Expected DOCUMENT VERIFICATION, got ${dataStartVerif.loan.status}`);
    }
    console.log('✓ STEP 4: Officer begins document verification → Status: UNDER REVIEW ➔ DOCUMENT VERIFICATION');

    // STEP 5: Officer verifies all required documents (DOCUMENT VERIFICATION → DOCUMENT VERIFIED)
    // First doc verified
    await fetch(`${BASE_URL}/documents/${doc1._id}/status`, {
      method: 'PUT',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    // Second doc verified -> triggers DOCUMENT VERIFIED and auto-progresses to ASSESSMENT COMPLETED
    const resDoc2 = await fetch(`${BASE_URL}/documents/${doc2._id}/status`, {
      method: 'PUT',
      headers: headersFor(officer1Token),
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    if (resDoc2.status !== 200) throw new Error('Document 2 verification failed');
    console.log('✓ STEP 5: Officer verifies all documents → Status: DOCUMENT VERIFICATION ➔ DOCUMENT VERIFIED');

    // STEP 6: Decision-support assessment completed (DOCUMENT VERIFIED → ASSESSMENT COMPLETED)
    const loanAfterAssess = await Loan.findById(e2eLoan._id);
    if (loanAfterAssess.status !== 'ASSESSMENT COMPLETED') {
      throw new Error(`Expected ASSESSMENT COMPLETED, got ${loanAfterAssess.status}`);
    }
    if (typeof loanAfterAssess.eligibilityScore !== 'number' || typeof loanAfterAssess.riskScore !== 'number') {
      throw new Error('Assessment scores missing on loan record');
    }
    console.log(`✓ STEP 6: Decision-support assessment generated → Status: DOCUMENT VERIFIED ➔ ASSESSMENT COMPLETED (Eligibility: ${loanAfterAssess.eligibilityScore}/100, Risk: ${loanAfterAssess.riskScore}%)`);

    // STEP 7: Assigned Officer submits RECOMMEND APPROVAL (ASSESSMENT COMPLETED → RECOMMENDED)
    const resRecommend = await fetch(`${BASE_URL}/loans/${e2eLoan._id}/recommend`, {
      method: 'POST',
      headers: headersFor(officer1Token),
      body: JSON.stringify({
        recommendation: 'RECOMMEND APPROVAL',
        remarks: 'Land title and KYC verified. Good seasonal yield outlook. Advise approval with partner bank.',
      }),
    });
    const dataRecommend = await resRecommend.json();
    if (dataRecommend.loan.status !== 'RECOMMENDED') {
      throw new Error(`Expected RECOMMENDED, got ${dataRecommend.loan.status}`);
    }
    console.log('✓ STEP 7: Assigned Officer submits RECOMMEND APPROVAL → Status: ASSESSMENT COMPLETED ➔ RECOMMENDED');

    // STEP 8: Admin records APPROVED (RECOMMENDED → APPROVED)
    const resDecision = await fetch(`${BASE_URL}/loans/${e2eLoan._id}/decision`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({
        decision: 'APPROVED',
        fundingSource: 'PARTNER_BANK',
        remarks: 'Credit committee reviewed and approved with Commercial Partner Bank funding.',
      }),
    });
    const dataDecision = await resDecision.json();
    if (dataDecision.loan.status !== 'APPROVED') {
      throw new Error(`Expected APPROVED, got ${dataDecision.loan.status}`);
    }
    console.log('✓ STEP 8: Admin records final decision APPROVED → Status: RECOMMENDED ➔ APPROVED (Funding: PARTNER_BANK)');

    // STEP 9: Admin records disbursement (APPROVED → DISBURSED)
    // STEP 10: Loan becomes active (DISBURSED → ACTIVE)
    const resDisburse = await fetch(`${BASE_URL}/loans/${e2eLoan._id}/disburse`, {
      method: 'POST',
      headers: headersFor(adminToken),
      body: JSON.stringify({ remarks: 'Disbursement recorded from designated partner bank facility.' }),
    });
    const dataDisburse = await resDisburse.json();
    if (dataDisburse.loan.status !== 'ACTIVE') {
      throw new Error(`Expected ACTIVE, got ${dataDisburse.loan.status}`);
    }
    if (!dataDisburse.loan.disbursedBy || !dataDisburse.loan.disbursedAt) {
      throw new Error('disbursedBy or disbursedAt not saved');
    }
    console.log('✓ STEP 9: Admin records disbursement → Status: APPROVED ➔ DISBURSED');
    console.log('✓ STEP 10: Loan activated for repayment monitoring → Status: DISBURSED ➔ ACTIVE');

    // Verify Amortization Schedule Generated
    const generatedRepayments = await Repayment.find({ loanId: e2eLoan._id }).sort({ dueDate: 1 });
    if (generatedRepayments.length !== 12) {
      throw new Error(`Expected 12 repayments generated, got ${generatedRepayments.length}`);
    }
    console.log(`✓ Verified EMI Repayment Schedule: ${generatedRepayments.length} installments generated`);

    // STEP 11: First repayment recorded -> transitions ACTIVE -> REPAYMENT MONITORING
    const initialFarmerScore = farmer.financialHealthScore;
    const firstEmi = generatedRepayments[0];

    const resPay = await fetch(`${BASE_URL}/repayments/${firstEmi._id}/pay`, {
      method: 'POST',
      headers: headersFor(adminToken),
    });
    const dataPay = await resPay.json();
    if (dataPay.repayment.status !== 'PAID') {
      throw new Error('Repayment not marked as PAID');
    }

    const loanInMonitoring = await Loan.findById(e2eLoan._id);
    if (loanInMonitoring.status !== 'REPAYMENT MONITORING') {
      throw new Error(`Expected REPAYMENT MONITORING, got ${loanInMonitoring.status}`);
    }

    // Verify financial health score recalculated with real formula (not hardcoded to 100)
    const updatedFarmer = await Farmer.findById(farmer._id);
    const farmerAllLoans = await Loan.find({ farmerId: farmer._id });
    const farmerAllRepayments = await Repayment.find({ farmerId: farmer._id });
    const expectedHealth = calculateFinancialHealthScore(updatedFarmer, farmerAllLoans, farmerAllRepayments);

    if (updatedFarmer.financialHealthScore !== expectedHealth.score) {
      throw new Error(`Health score mismatch: expected ${expectedHealth.score}, got ${updatedFarmer.financialHealthScore}`);
    }
    console.log(`✓ STEP 11: First repayment recorded (₹${firstEmi.amount}) → Status: ACTIVE ➔ REPAYMENT MONITORING`);
    console.log(`  Outstanding balance decreased to ₹${dataPay.outstandingBalance}. Health score: ${initialFarmerScore} ➔ ${updatedFarmer.financialHealthScore}/100 (${expectedHealth.rating})`);

    // STEP 12: Process ALL remaining EMI installments (EMIs 2 through 12) through real repayment endpoint
    console.log(`\n--- Processing Remaining ${generatedRepayments.length - 1} EMI Installments ---`);
    for (let i = 1; i < generatedRepayments.length; i++) {
      const emi = generatedRepayments[i];
      const resEmi = await fetch(`${BASE_URL}/repayments/${emi._id}/pay`, {
        method: 'POST',
        headers: headersFor(adminToken),
      });
      const emiData = await resEmi.json();
      if (emiData.repayment.status !== 'PAID') {
        throw new Error(`EMI installment #${i + 1} payment failed`);
      }
    }

    // Verify all installments are PAID, outstanding = 0, overdue = 0
    const finalRepayments = await Repayment.find({ loanId: e2eLoan._id }).sort({ dueDate: 1 });
    const allPaid = finalRepayments.every(r => r.status === 'PAID');
    const unpaidList = finalRepayments.filter(r => r.status !== 'PAID');
    const finalOutstanding = unpaidList.reduce((sum, r) => sum + r.principal, 0);
    const overdueList = finalRepayments.filter(r => r.status === 'OVERDUE');

    if (!allPaid) throw new Error('Not all installments marked as PAID');
    if (finalOutstanding !== 0) throw new Error(`Outstanding balance not zero: ${finalOutstanding}`);
    if (overdueList.length !== 0) throw new Error(`Overdue installments remain: ${overdueList.length}`);

    console.log(`✓ STEP 12: All ${finalRepayments.length} installments paid → Status: every EMI is PAID, outstanding balance = ₹0, overdue = ₹0`);

    // STEP 13: Loan status becomes REPAYMENT MONITORING → CLOSED
    const finalLoan = await Loan.findById(e2eLoan._id);
    if (finalLoan.status !== 'CLOSED') {
      throw new Error(`Expected loan status CLOSED, got ${finalLoan.status}`);
    }
    console.log(`✓ STEP 13: Loan status successfully transitioned: REPAYMENT MONITORING ➔ CLOSED`);

    // STEP 14: Verify final audit event LOAN_CLOSED and full audit chain
    const fullAuditChain = await AuditLog.find({ loanId: e2eLoan._id }).sort({ createdAt: 1 });
    const auditActions = fullAuditChain.map(a => a.action);
    console.log(`\n✓ STEP 14: Audit Timeline contains ${fullAuditChain.length} events:`);

    fullAuditChain.forEach((log, i) => {
      console.log(`   ${i + 1}. [${log.action}] ${log.previousStatus || '-'} ➔ ${log.newStatus || '-'} | ${log.remarks.slice(0, 65)}...`);
    });

    const expectedActions = [
      'APPLICATION_SUBMITTED',
      'OFFICER_ASSIGNED',
      'DOCUMENT_VERIFICATION_STARTED',
      'DOCUMENT_VERIFIED',
      'ASSESSMENT_GENERATED',
      'OFFICER_RECOMMENDATION',
      'ADMIN_DECISION',
      'DISBURSEMENT_RECORDED',
      'LOAN_ACTIVATED',
      'REPAYMENT_MONITORING_STARTED',
      'REPAYMENT_RECORDED',
      'LOAN_CLOSED',
    ];

    expectedActions.forEach(action => {
      if (!auditActions.includes(action)) {
        throw new Error(`Audit chain missing required event: ${action}`);
      }
    });
    console.log('\n✓ Full traceable audit timeline verified through final loan closure without skipping any step!\n');

    console.log('================================================================');
    console.log('ALL VERIFICATION CHECKS PASSED: AgriLend360 FPO Credit Platform');
    console.log('================================================================\n');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runCompleteVerification().catch(err => {
  console.error('\n❌ VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});
