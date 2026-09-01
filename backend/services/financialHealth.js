/**
 * AgriLend360 Financial Health Calculator
 * 
 * Computes a score between 0 and 100 representing a farmer's creditworthiness
 * based on repayment rates, debt utilization, and history of loan closure.
 */

export const calculateFinancialHealthScore = (farmer, loans = [], repayments = []) => {
  let score = 60; // Starting baseline

  const completedLoans = loans.filter(l => l.status === 'CLOSED');
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED');
  const farmerRepayments = repayments || [];

  // 1. Repayment rate (up to +25 points or down to -30 points)
  const dueRepayments = farmerRepayments.filter(r => r.status === 'PAID' || r.status === 'OVERDUE' || r.status === 'DUE');
  if (dueRepayments.length > 0) {
    const paidCount = dueRepayments.filter(r => r.status === 'PAID').length;
    const repaymentRatio = paidCount / dueRepayments.length;
    
    // Scale points: 100% repayment is +25, 50% is -10, 0% is -30
    const repaymentBonus = Math.round((repaymentRatio - 0.6) * 62.5); // ranges from -37.5 to +25
    score += Math.max(-40, Math.min(25, repaymentBonus));
  } else {
    // No due repayments yet, add a moderate buffer for active loans
    if (activeLoans.length > 0) {
      score += 5;
    }
  }

  // 2. Overdue Penalties (up to -40 points)
  const overdueCount = farmerRepayments.filter(r => r.status === 'OVERDUE').length;
  score -= overdueCount * 15;

  // 3. Successful Closures (up to +15 points)
  const closuresBonus = completedLoans.length * 8;
  score += Math.min(15, closuresBonus);

  // 4. Debt-to-Income Utilization Penalty (up to -20 points)
  const outstandingDebt = activeLoans.reduce((sum, l) => {
    // find min remaining balance for this loan
    const loanRepayments = farmerRepayments.filter(r => r.loanId.toString() === l._id.toString());
    if (loanRepayments.length > 0) {
      return sum + Math.min(...loanRepayments.map(r => r.remainingBalance));
    }
    return sum + l.loanAmount;
  }, 0);

  const annualIncome = farmer.annualIncome || 50000;
  const debtRatio = outstandingDebt / annualIncome;
  if (debtRatio > 0.8) {
    score -= 20;
  } else if (debtRatio > 0.5) {
    score -= 10;
  } else if (debtRatio > 0.2) {
    score -= 5;
  } else if (debtRatio > 0) {
    score += 5; // Low utilization bonus
  }

  // Bound score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Generate assessment text
  let riskLevel = 'Low';
  let rating = 'Fair';
  if (finalScore >= 80) {
    riskLevel = 'Low';
    rating = 'Excellent';
  } else if (finalScore >= 60) {
    riskLevel = 'Low';
    rating = 'Good';
  } else if (finalScore >= 40) {
    riskLevel = 'Medium';
    rating = 'Fair';
  } else if (finalScore >= 20) {
    riskLevel = 'High';
    rating = 'Poor';
  } else {
    riskLevel = 'Critical';
    rating = 'Very Poor';
  }

  return {
    score: finalScore,
    riskLevel,
    rating,
  };
};
