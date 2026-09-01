/**
 * AgriLend360 Risk Assessment Engine
 * 
 * Modular engine calculating Default Risk Probability, Risk Level, 
 * and Loan Eligibility metrics based on demographic, farming, and repayment records.
 */

export const calculateRiskAndEligibility = (farmer, requestedAmount, activeLoans = [], repayments = []) => {
  let riskScore = 0;
  const factors = [];

  const annualIncome = farmer.annualIncome || 50000;
  const landArea = farmer.landArea || 1;
  const primaryCrop = farmer.primaryCrop || 'Other';

  // 1. Debt-to-Income / Loan-to-Income (LTI) Ratio (Weight: 25%)
  const totalOutstanding = activeLoans.reduce((sum, loan) => {
    if (loan.status === 'ACTIVE' || loan.status === 'DISBURSED') {
      // Find remaining balance from repayments or default to loanAmount
      const loanRepayments = repayments.filter(r => r.loanId.toString() === loan._id.toString());
      if (loanRepayments.length > 0) {
        // Get the remaining balance of the latest unpaid or minimum remaining balance
        const balances = loanRepayments.map(r => r.remainingBalance);
        return sum + Math.min(...balances);
      }
      return sum + loan.loanAmount;
    }
    return sum;
  }, 0);

  const totalProposedDebt = requestedAmount + totalOutstanding;
  const lti = totalProposedDebt / annualIncome;
  let ltiScore = 0;

  if (lti <= 0.2) {
    ltiScore = 15;
    factors.push('✓ Low loan-to-income ratio');
  } else if (lti <= 0.4) {
    ltiScore = 40;
    factors.push('✓ Manageable debt level compared to annual income');
  } else if (lti <= 0.7) {
    ltiScore = 70;
    factors.push('⚠ Moderate-to-high loan-to-income ratio');
  } else {
    ltiScore = 100;
    factors.push('❌ Extremely high loan-to-income ratio');
  }
  riskScore += ltiScore * 0.25;

  // 2. Repayment History / Missed Payments (Weight: 35%)
  let repaymentScore = 0;
  const completedLoans = activeLoans.filter(l => l.status === 'CLOSED');
  const activeOrDisbursed = activeLoans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED');

  if (activeLoans.length === 0) {
    // No history - neutral risk
    repaymentScore = 30;
    factors.push('✓ First-time borrower with clean slate');
  } else {
    const overdueRepayments = repayments.filter(r => r.status === 'OVERDUE');
    const totalRepayments = repayments.filter(r => r.status === 'PAID');
    
    if (overdueRepayments.length > 0) {
      repaymentScore = Math.min(100, 40 + overdueRepayments.length * 20);
      factors.push(`❌ Has ${overdueRepayments.length} overdue repayment installment(s)`);
    } else if (completedLoans.length > 0 && activeOrDisbursed.length === 0) {
      repaymentScore = 10;
      factors.push('✓ Excellent record of full loan repayment and closure');
    } else {
      repaymentScore = 20;
      factors.push('✓ Satisfactory payment history on active accounts');
    }
  }
  riskScore += repaymentScore * 0.35;

  // 3. Existing Active Loans Count (Weight: 15%)
  let activeCountScore = 0;
  const activeCount = activeOrDisbursed.length;
  if (activeCount === 0) {
    activeCountScore = 10;
  } else if (activeCount === 1) {
    activeCountScore = 40;
    factors.push('⚠ Already has one active loan');
  } else {
    activeCountScore = 90;
    factors.push(`❌ Multiple concurrent active loans (${activeCount})`);
  }
  riskScore += activeCountScore * 0.15;

  // 4. Debt per Acre Coverage / Land Productivity (Weight: 15%)
  let landDebtScore = 0;
  const loanPerAcre = requestedAmount / landArea;
  if (loanPerAcre < 15000) {
    landDebtScore = 15;
    factors.push('✓ Solid land area coverage per requested loan amount');
  } else if (loanPerAcre < 35000) {
    landDebtScore = 45;
  } else if (loanPerAcre < 75000) {
    landDebtScore = 75;
    factors.push('⚠ High loan density relative to land holdings');
  } else {
    landDebtScore = 100;
    factors.push('❌ Critical debt load per acre of cultivation land');
  }
  riskScore += landDebtScore * 0.15;

  // 5. Crop Risk Profile (Weight: 10%)
  let cropRiskScore = 30;
  const highRiskCrops = ['Cotton', 'Groundnut', 'Tobacco'];
  const medRiskCrops = ['Paddy', 'Wheat', 'Maize', 'Sugarcane'];
  const lowRiskCrops = ['Vegetables', 'Fruits', 'Pulses'];

  if (highRiskCrops.includes(primaryCrop)) {
    cropRiskScore = 75;
    factors.push(`⚠ Crop crop-risk level for ${primaryCrop} is elevated due to price volatility`);
  } else if (medRiskCrops.includes(primaryCrop)) {
    cropRiskScore = 45;
  } else if (lowRiskCrops.includes(primaryCrop)) {
    cropRiskScore = 15;
    factors.push(`✓ Cultivating highly stable crop type (${primaryCrop})`);
  }
  riskScore += cropRiskScore * 0.10;

  // Round riskScore to nearest integer
  riskScore = Math.round(riskScore);

  // Categorize Risk Level
  let riskLevel = 'LOW';
  if (riskScore > 80) {
    riskLevel = 'CRITICAL';
  } else if (riskScore > 60) {
    riskLevel = 'HIGH';
  } else if (riskScore > 30) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Calculate Eligibility Score (inverse of risk, adjusted by credit capability)
  let eligibilityScore = Math.max(0, 100 - riskScore);

  // Recommended Loan Range (based on income and land scale)
  // Base recommendation: max 30% of income, scaled down if high risk
  const maxAllowableAmount = annualIncome * 0.35 * (eligibilityScore / 100);
  const minRecommended = Math.max(10000, Math.floor((maxAllowableAmount * 0.6) / 5000) * 5000);
  const maxRecommended = Math.max(25000, Math.floor(maxAllowableAmount / 5000) * 5000);

  return {
    riskScore, // Default Probability (0-100)
    riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
    eligibilityScore, // (0-100)
    recommendedMin: minRecommended,
    recommendedMax: maxRecommended,
    factors: factors.slice(0, 4), // Top 4 contributing factors
  };
};
