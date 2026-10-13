import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import AuditLog from '../models/AuditLog.js';
import Document from '../models/Document.js';

dotenv.config();

// EMI generator helper
const generateEMIArray = (loanId, farmerId, principal, annualRate, durationMonths, startDate) => {
  const schedule = [];
  const monthlyRate = (annualRate / 12) / 100;
  
  let emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / 
        (Math.pow(1 + monthlyRate, durationMonths) - 1);
  if (monthlyRate === 0) emi = principal / durationMonths;

  let remainingPrincipal = principal;
  let baseDate = new Date(startDate);

  for (let i = 1; i <= durationMonths; i++) {
    const interest = remainingPrincipal * monthlyRate;
    let principalComponent = emi - interest;

    if (i === durationMonths) {
      principalComponent = remainingPrincipal;
    }

    remainingPrincipal -= principalComponent;
    
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      loanId,
      farmerId,
      amount: Math.round((principalComponent + interest) * 100) / 100,
      principal: Math.round(principalComponent * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      dueDate,
      status: 'UPCOMING',
      remainingBalance: Math.max(0, Math.round(remainingPrincipal * 100) / 100),
    });
  }
  return schedule;
};

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrilend360');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Farmer.deleteMany({});
    await Loan.deleteMany({});
    await Repayment.deleteMany({});
    await AuditLog.deleteMany({});
    await Document.deleteMany({});

    console.log('Cleared existing database collections.');

    // 1. Create Core Role Users
    const adminUser = await User.create({
      name: 'Anjali Sharma',
      email: 'admin@agrilend360.com',
      password: 'admin123',
      role: 'Admin',
    });

    const officerUser1 = await User.create({
      name: 'Ramesh Patel',
      email: 'officer@agrilend360.com',
      password: 'officer123',
      role: 'Loan Officer',
    });

    const officerUser2 = await User.create({
      name: 'Deepak Rao',
      email: 'officer2@agrilend360.com',
      password: 'officer123',
      role: 'Loan Officer',
    });

    // Default farmer user
    const farmerUser = await User.create({
      name: 'Ravi Kumar',
      email: 'farmer@agrilend360.com',
      password: 'farmer123',
      role: 'Farmer',
    });

    // Create profile for default farmer
    const defaultFarmer = await Farmer.create({
      userId: farmerUser._id,
      name: 'Ravi Kumar',
      mobile: '9876543210',
      governmentId: '3210 4321 5432', // Aadhaar masked format
      address: 'House No 42, Hunasur Road',
      village: 'Hunasur',
      district: 'Mysuru',
      state: 'Karnataka',
      latitude: 12.31,
      longitude: 76.65,
      landArea: 4.5,
      ownershipType: 'Owned',
      primaryCrop: 'Paddy',
      secondaryCrop: 'Sugarcane',
      annualIncome: 180000,
      financialHealthScore: 82,
    });

    console.log('Core admin, officer, and primary farmer users created.');

    // 2. Create 25 additional farmers to populate Map and Analytics
    const villageList = [
      { name: 'Kote', dist: 'Mysuru', state: 'Karnataka', lat: 12.25, lng: 76.58 },
      { name: 'Bannur', dist: 'Mysuru', state: 'Karnataka', lat: 12.33, lng: 76.85 },
      { name: 'Gundlupet', dist: 'Chamarajanagar', state: 'Karnataka', lat: 11.81, lng: 76.69 },
      { name: 'T-Narasipura', dist: 'Mysuru', state: 'Karnataka', lat: 12.21, lng: 76.90 },
      { name: 'Hullahalli', dist: 'Mysuru', state: 'Karnataka', lat: 12.10, lng: 76.60 },
      { name: 'Malavalli', dist: 'Mandya', state: 'Karnataka', lat: 12.38, lng: 77.05 },
      { name: 'Srirangapatna', dist: 'Mandya', state: 'Karnataka', lat: 12.42, lng: 76.69 },
    ];

    const cropList = ['Paddy', 'Wheat', 'Sugarcane', 'Cotton', 'Maize', 'Vegetables', 'Groundnut'];
    const farmerNames = [
      'Siddappa Gowda', 'Basavaraj Patil', 'Ningappa', 'Chikkaiah', 'Mariyappa', 
      'Malleshappa', 'Rajesh K', 'Somashekar', 'Kempaiah', 'Puttaiah',
      'Govindappa', 'Ramachandra', 'Venkatesh Mandya', 'Shivakumar', 'Kumar Swamy',
      'Devendrappa', 'Siddaraju', 'Appaji Gowda', 'Mahadeva Prasad', 'Girish H N',
      'Swamy Gowda', 'Narayanappa', 'Chandrashekar', 'Lokesh J', 'Eshwar Prasad'
    ];

    const farmers = [defaultFarmer];

    for (let i = 0; i < farmerNames.length; i++) {
      const v = villageList[i % villageList.length];
      const name = farmerNames[i];
      const email = `farmer${i + 1}@agrilend360.com`;
      
      const user = await User.create({
        name,
        email,
        password: 'farmer123',
        role: 'Farmer',
      });

      // Scatter coords slightly around the village center
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;

      const f = await Farmer.create({
        userId: user._id,
        name,
        mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        governmentId: `${Math.floor(1000 + Math.random() * 9000)} **** ****`,
        address: `${v.name} Village, Ward No ${i % 4 + 1}`,
        village: v.name,
        district: v.dist,
        state: v.state,
        latitude: v.lat + latOffset,
        longitude: v.lng + lngOffset,
        landArea: Math.round((2.0 + Math.random() * 10) * 10) / 10,
        ownershipType: i % 5 === 0 ? 'Leased' : (i % 6 === 0 ? 'Joint' : 'Owned'),
        primaryCrop: cropList[i % cropList.length],
        secondaryCrop: i % 3 === 0 ? cropList[(i + 2) % cropList.length] : '',
        annualIncome: Math.round((120000 + Math.random() * 250000) / 5000) * 5000,
        financialHealthScore: Math.floor(45 + Math.random() * 50),
      });
      farmers.push(f);
    }

    console.log(`Seeded ${farmers.length} total farmers.`);

    // 3. Create Loan Applications with realistic workflow distribution
    const loanPurposes = ['Seeds', 'Fertilizer', 'Equipment', 'Irrigation', 'Livestock', 'Crop cultivation'];
    const fundingSources = ['FPO_FUND', 'PARTNER_BANK', 'FINANCIAL_INSTITUTION', 'OTHER'];
    
    // Status distribution:
    // 0: defaultFarmer: Active loan (disbursed, repayments scheduled)
    // 1-4: CLOSED loans (successfully repaid)
    // 5-11: ACTIVE loans (some paid, some overdue)
    // 12-14: PENDING (new submissions)
    // 15-17: UNDER REVIEW (assigned to officer)
    // 18-19: DOCUMENT VERIFIED (docs verified, assessment complete)
    // 20-21: RECOMMENDED (officer submitted recommendation, awaiting admin decision)
    // 22-23: APPROVED (approved by admin, awaiting disbursement recording)
    // 24: NEEDS_INFORMATION (officer requested extra details)
    // 25: REJECTED (declined)

    const today = new Date();

    for (let i = 0; i < farmers.length; i++) {
      const farmer = farmers[i];
      const loanAmount = Math.round((40000 + Math.random() * 80000) / 5000) * 5000;
      const purpose = loanPurposes[i % loanPurposes.length];
      const duration = i % 2 === 0 ? 12 : 6;
      const fundingSource = fundingSources[i % fundingSources.length];
      const assignedOfficer = i % 2 === 0 ? officerUser1 : officerUser2;

      let status = 'PENDING';
      let riskScore = 20;
      let riskLevel = 'LOW';
      let eligibilityScore = 80;
      let officerRecommendation = 'NONE';
      let officerRecommendationRemarks = '';
      let recommendedBy = undefined;
      let recommendedAt = undefined;
      let finalDecision = 'PENDING';
      let finalDecisionRemarks = '';
      let approvedBy = undefined;
      let approvedAt = undefined;
      let disbursedBy = undefined;
      let disbursedAt = undefined;

      if (i === 0) {
        status = 'ACTIVE';
        riskScore = 18;
        riskLevel = 'LOW';
        eligibilityScore = 82;
        officerRecommendation = 'RECOMMEND APPROVAL';
        officerRecommendationRemarks = 'Verified borrower has exemplary yield record and clean land ownership.';
        recommendedBy = officerUser1._id;
        recommendedAt = new Date(today.getTime() - 85 * 24 * 60 * 60 * 1000);
        finalDecision = 'APPROVED';
        finalDecisionRemarks = 'Approved by authorized FPO approving authority.';
        approvedBy = adminUser._id;
        approvedAt = new Date(today.getTime() - 82 * 24 * 60 * 60 * 1000);
        disbursedBy = adminUser._id;
        disbursedAt = new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000);
      } else if (i >= 1 && i <= 4) {
        status = 'CLOSED';
        riskScore = 15;
        riskLevel = 'LOW';
        eligibilityScore = 88;
        officerRecommendation = 'RECOMMEND APPROVAL';
        officerRecommendationRemarks = 'Applicant has completed previous cycles without default.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 195 * 24 * 60 * 60 * 1000);
        finalDecision = 'APPROVED';
        finalDecisionRemarks = 'Approved allocation.';
        approvedBy = adminUser._id;
        approvedAt = new Date(today.getTime() - 190 * 24 * 60 * 60 * 1000);
        disbursedBy = adminUser._id;
        disbursedAt = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
      } else if (i >= 5 && i <= 11) {
        status = 'ACTIVE';
        riskScore = Math.floor(15 + Math.random() * 70);
        if (riskScore > 80) riskLevel = 'CRITICAL';
        else if (riskScore > 60) riskLevel = 'HIGH';
        else if (riskScore > 30) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';
        eligibilityScore = 100 - riskScore;
        officerRecommendation = 'RECOMMEND APPROVAL';
        officerRecommendationRemarks = 'Agricultural yield sufficient to support requested repayment schedule.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 85 * 24 * 60 * 60 * 1000);
        finalDecision = 'APPROVED';
        finalDecisionRemarks = 'FPO credit committee authorized loan release.';
        approvedBy = adminUser._id;
        approvedAt = new Date(today.getTime() - 82 * 24 * 60 * 60 * 1000);
        disbursedBy = adminUser._id;
        disbursedAt = new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000);
      } else if (i >= 12 && i <= 14) {
        status = 'PENDING';
        riskScore = Math.floor(20 + Math.random() * 25);
        riskLevel = 'LOW';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 15 && i <= 17) {
        status = 'UNDER REVIEW';
        riskScore = Math.floor(25 + Math.random() * 30);
        riskLevel = riskScore > 30 ? 'MEDIUM' : 'LOW';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 18 && i <= 19) {
        status = 'DOCUMENT VERIFIED';
        riskScore = Math.floor(20 + Math.random() * 30);
        riskLevel = 'LOW';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 20 && i <= 21) {
        status = 'RECOMMENDED';
        riskScore = Math.floor(20 + Math.random() * 30);
        riskLevel = riskScore > 30 ? 'MEDIUM' : 'LOW';
        eligibilityScore = 100 - riskScore;
        officerRecommendation = 'RECOMMEND APPROVAL';
        officerRecommendationRemarks = 'Farmer documents verified. Clean credit standing. Ready for final FPO approval.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (i >= 22 && i <= 23) {
        status = 'APPROVED';
        riskScore = Math.floor(12 + Math.random() * 20);
        riskLevel = 'LOW';
        eligibilityScore = 90;
        officerRecommendation = 'RECOMMEND APPROVAL';
        officerRecommendationRemarks = 'Highly recommended based on diversified vegetable farming assets.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
        finalDecision = 'APPROVED';
        finalDecisionRemarks = 'Approved by authorized FPO approving authority. Ready for disbursement recording.';
        approvedBy = adminUser._id;
        approvedAt = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      } else if (i === 24) {
        status = 'NEEDS_INFORMATION';
        riskScore = 55;
        riskLevel = 'MEDIUM';
        eligibilityScore = 45;
        officerRecommendation = 'NEEDS ADDITIONAL INFORMATION';
        officerRecommendationRemarks = 'Please submit updated land survey deed and crop harvest certificate.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000);
        finalDecision = 'NEEDS_INFORMATION';
        finalDecisionRemarks = 'Awaiting updated documentation.';
      } else {
        status = 'REJECTED';
        riskScore = Math.floor(70 + Math.random() * 25);
        riskLevel = riskScore > 80 ? 'CRITICAL' : 'HIGH';
        eligibilityScore = 15;
        officerRecommendation = 'RECOMMEND REJECTION';
        officerRecommendationRemarks = 'Unmanageable debt-to-income density relative to small land parcel.';
        recommendedBy = assignedOfficer._id;
        recommendedAt = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
        finalDecision = 'REJECTED';
        finalDecisionRemarks = 'FPO authority declined application based on elevated default risk profile.';
        approvedBy = adminUser._id;
        approvedAt = new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000);
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const l = await Loan.create({
        loanId: `AL360-${Date.now().toString().slice(-4)}${randomSuffix}`,
        farmerId: farmer._id,
        loanAmount,
        purpose,
        duration,
        interestRate: 8.5,
        status,
        riskScore,
        riskLevel,
        eligibilityScore,
        fundingSource,
        assignedOfficer: ['UNDER REVIEW', 'DOCUMENT VERIFIED', 'RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED', 'REJECTED', 'NEEDS_INFORMATION'].includes(status) ? assignedOfficer._id : undefined,
        assignedAt: ['UNDER REVIEW', 'DOCUMENT VERIFIED', 'RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED', 'REJECTED', 'NEEDS_INFORMATION'].includes(status) ? new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000) : undefined,
        officerRecommendation,
        officerRecommendationRemarks,
        recommendedBy,
        recommendedAt,
        finalDecision,
        finalDecisionRemarks,
        approvedBy,
        approvedAt,
        disbursedBy,
        disbursedAt,
      });

      // Seeding Audit logs
      await AuditLog.create({
        loanId: l._id,
        userId: farmer.userId,
        action: 'APPLICATION_SUBMITTED',
        previousStatus: '',
        newStatus: 'PENDING',
        remarks: 'Farmer submitted digital loan application through FPO platform.',
        timestamp: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
      });

      await AuditLog.create({
        loanId: l._id,
        userId: farmer.userId,
        action: 'ASSESSMENT_GENERATED',
        previousStatus: 'PENDING',
        newStatus: 'PENDING',
        remarks: `Decision-support assessment generated. Eligibility: ${eligibilityScore}/100, Default Risk: ${riskScore}% (${riskLevel}).`,
        timestamp: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
      });

      if (l.assignedOfficer) {
        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'OFFICER_ASSIGNED',
          previousStatus: 'PENDING',
          newStatus: 'UNDER REVIEW',
          remarks: `Admin assigned application to Loan Officer ${assignedOfficer.name}.`,
          timestamp: new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000),
        });
      }

      // Seed documents for the loan
      await Document.create({
        farmerId: farmer._id,
        loanId: l._id,
        documentType: 'Identity Proof',
        fileName: 'Aadhaar_KYC_Proof.pdf',
        filePath: './uploads/sample_kyc_doc.pdf',
        verificationStatus: ['DOCUMENT VERIFIED', 'RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED'].includes(status) ? 'VERIFIED' : 'PENDING',
        uploadedAt: new Date(today.getTime() - 98 * 24 * 60 * 60 * 1000),
      });

      await Document.create({
        farmerId: farmer._id,
        loanId: l._id,
        documentType: 'Land Document',
        fileName: 'Land_Title_Registry.pdf',
        filePath: './uploads/sample_kyc_doc.pdf',
        verificationStatus: ['DOCUMENT VERIFIED', 'RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED'].includes(status) ? 'VERIFIED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        uploadedAt: new Date(today.getTime() - 98 * 24 * 60 * 60 * 1000),
      });

      if (['DOCUMENT VERIFIED', 'RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: assignedOfficer._id,
          action: 'DOCUMENT_VERIFIED',
          previousStatus: 'UNDER REVIEW',
          newStatus: 'DOCUMENT VERIFIED',
          remarks: 'Verified Aadhaar KYC card, Land Title Deed, and crop cultivation data.',
          timestamp: new Date(today.getTime() - 92 * 24 * 60 * 60 * 1000),
        });
      }

      if (['RECOMMENDED', 'APPROVED', 'ACTIVE', 'CLOSED', 'REJECTED', 'NEEDS_INFORMATION'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: assignedOfficer._id,
          action: 'OFFICER_RECOMMENDATION',
          previousStatus: 'DOCUMENT VERIFIED',
          newStatus: status === 'RECOMMENDED' ? 'RECOMMENDED' : (status === 'NEEDS_INFORMATION' ? 'NEEDS_INFORMATION' : 'DOCUMENT VERIFIED'),
          remarks: `Loan Officer submitted formal recommendation: "${officerRecommendation}". Remarks: ${officerRecommendationRemarks}`,
          timestamp: recommendedAt || new Date(today.getTime() - 91 * 24 * 60 * 60 * 1000),
        });
      }

      if (['APPROVED', 'ACTIVE', 'CLOSED'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'ADMIN_DECISION',
          previousStatus: 'RECOMMENDED',
          newStatus: 'APPROVED',
          remarks: `Authorized FPO Approving Authority decision: APPROVED. Funding Source: ${fundingSource}. Remarks: Approved by management.`,
          timestamp: approvedAt || new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        });
      }

      if (status === 'REJECTED') {
        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'ADMIN_DECISION',
          previousStatus: 'RECOMMENDED',
          newStatus: 'REJECTED',
          remarks: `Authorized FPO Approving Authority decision: REJECTED. Remarks: Declined due to high default risk score.`,
          timestamp: approvedAt || new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000),
        });
      }

      if (['ACTIVE', 'CLOSED'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'DISBURSEMENT_RECORDED',
          previousStatus: 'APPROVED',
          newStatus: 'ACTIVE',
          remarks: `Disbursement recorded under funding source: ${fundingSource}. Repayment schedule generated. Amortization tracking active.`,
          timestamp: disbursedAt || new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000),
        });

        // 4. Seeding Repayments
        const schedule = generateEMIArray(l._id, farmer._id, loanAmount, 8.5, duration, new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000));
        
        if (status === 'CLOSED') {
          for (const emi of schedule) {
            emi.status = 'PAID';
            emi.paymentDate = new Date(emi.dueDate.getTime() - 1 * 24 * 60 * 60 * 1000);
          }
          await AuditLog.create({
            loanId: l._id,
            userId: adminUser._id,
            action: 'LOAN_CLOSED',
            previousStatus: 'ACTIVE',
            newStatus: 'CLOSED',
            remarks: 'All scheduled EMIs fully settled. Loan successfully closed.',
            timestamp: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
          });
        } else if (status === 'ACTIVE') {
          for (let k = 0; k < schedule.length; k++) {
            const emi = schedule[k];
            const isPast = emi.dueDate < today;
            
            if (isPast) {
              if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
                if (k === 0) {
                  emi.status = 'PAID';
                  emi.paymentDate = emi.dueDate;
                } else {
                  emi.status = 'OVERDUE';
                }
              } else {
                emi.status = 'PAID';
                emi.paymentDate = emi.dueDate;
              }
            } else {
              emi.status = 'UPCOMING';
            }
          }
        }
        await Repayment.insertMany(schedule);
      }
    }

    console.log('Seeded documents, repayments, and audit logs successfully.');

    // 5. Update Farmer health scores based on newly generated repayment schedule
    const allFarmers = await Farmer.find({});
    const allLoans = await Loan.find({});
    const allRepayments = await Repayment.find({});

    for (const f of allFarmers) {
      const fLoans = allLoans.filter(l => l.farmerId.toString() === f._id.toString());
      const fRepayments = allRepayments.filter(r => r.farmerId.toString() === f._id.toString());

      let activeCount = fLoans.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status)).length;
      let completedCount = fLoans.filter(l => l.status === 'CLOSED').length;
      let overdueCount = fRepayments.filter(r => r.status === 'OVERDUE').length;

      let score = 70;
      if (completedCount > 0) score += 10;
      if (activeCount > 0) score += 5;
      score -= overdueCount * 20;

      f.financialHealthScore = Math.max(15, Math.min(95, score));
      await f.save();
    }

    console.log('Updated farmer financial health profiles.');
    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database: ', error);
    process.exit(1);
  }
};

seedData();
