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

    const officerUser = await User.create({
      name: 'Ramesh Patel',
      email: 'officer@agrilend360.com',
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

    // 3. Create Loan Applications and Schedules
    const loanPurposes = ['Seeds', 'Fertilizer', 'Equipment', 'Irrigation', 'Livestock', 'Crop cultivation'];
    
    // We will distribute loans across different statuses
    // 0: defaultFarmer: Active loan
    // 1-5: CLOSED loans (historical success)
    // 6-12: ACTIVE loans (some paid, some overdue)
    // 13-18: PENDING / UNDER REVIEW applications
    // 19-21: DOCUMENT VERIFIED / APPROVED applications
    // 22-24: REJECTED applications

    const today = new Date();

    for (let i = 0; i < farmers.length; i++) {
      const farmer = farmers[i];
      const loanAmount = Math.round((40000 + Math.random() * 80000) / 5000) * 5000;
      const purpose = loanPurposes[i % loanPurposes.length];
      const duration = i % 2 === 0 ? 12 : 6;
      
      let status = 'PENDING';
      let riskScore = 20;
      let riskLevel = 'LOW';
      let eligibilityScore = 80;

      if (i === 0) {
        status = 'ACTIVE';
        riskScore = 18;
        riskLevel = 'LOW';
        eligibilityScore = 82;
      } else if (i >= 1 && i <= 5) {
        status = 'CLOSED';
        riskScore = 15;
        riskLevel = 'LOW';
        eligibilityScore = 85;
      } else if (i >= 6 && i <= 12) {
        status = 'ACTIVE';
        riskScore = Math.floor(15 + Math.random() * 70);
        if (riskScore > 80) riskLevel = 'CRITICAL';
        else if (riskScore > 60) riskLevel = 'HIGH';
        else if (riskScore > 30) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 13 && i <= 15) {
        status = 'PENDING';
        riskScore = Math.floor(20 + Math.random() * 30);
        riskLevel = riskScore > 30 ? 'MEDIUM' : 'LOW';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 16 && i <= 18) {
        status = 'UNDER REVIEW';
        riskScore = Math.floor(35 + Math.random() * 40);
        riskLevel = riskScore > 60 ? 'HIGH' : 'MEDIUM';
        eligibilityScore = 100 - riskScore;
      } else if (i >= 19 && i <= 21) {
        status = 'APPROVED';
        riskScore = Math.floor(10 + Math.random() * 20);
        riskLevel = 'LOW';
        eligibilityScore = 90;
      } else {
        status = 'REJECTED';
        riskScore = Math.floor(65 + Math.random() * 30);
        riskLevel = riskScore > 80 ? 'CRITICAL' : 'HIGH';
        eligibilityScore = 15;
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
        approvedBy: ['APPROVED', 'ACTIVE', 'CLOSED'].includes(status) ? adminUser._id : undefined,
        approvedAt: ['APPROVED', 'ACTIVE', 'CLOSED'].includes(status) ? new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000) : undefined,
        disbursedAt: ['ACTIVE', 'CLOSED'].includes(status) ? new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000) : undefined,
      });

      // Seeding Audit logs
      await AuditLog.create({
        loanId: l._id,
        userId: farmer.userId,
        action: 'SUBMITTED',
        previousStatus: '',
        newStatus: 'PENDING',
        remarks: 'Farmer submitted application through mobile app.',
        timestamp: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
      });

      if (['APPROVED', 'ACTIVE', 'CLOSED'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: officerUser._id,
          action: 'STATUS_CHANGE',
          previousStatus: 'PENDING',
          newStatus: 'DOCUMENT_VERIFIED',
          remarks: 'Verified Aadhaar, Land Title Deed, and crop income certificate.',
          timestamp: new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000),
        });

        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'STATUS_CHANGE',
          previousStatus: 'DOCUMENT_VERIFIED',
          newStatus: 'APPROVED',
          remarks: 'Approved based on solid yield estimation and high credit health score.',
          timestamp: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        });
      }

      if (['ACTIVE', 'CLOSED'].includes(status)) {
        await AuditLog.create({
          loanId: l._id,
          userId: adminUser._id,
          action: 'STATUS_CHANGE',
          previousStatus: 'APPROVED',
          newStatus: 'ACTIVE',
          remarks: 'Loan disbursed to Bank Account ending in 8892.',
          timestamp: new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000),
        });

        // 4. Seeding Repayments
        // Disbursed 80 days ago. Each EMI is monthly (30 days interval).
        // Months elapsed = approx 2.6 months (due dates 50 days ago, 20 days ago, and 10 days in the future).
        const schedule = generateEMIArray(l._id, farmer._id, loanAmount, 8.5, duration, new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000));
        
        if (status === 'CLOSED') {
          // All EMIs are paid
          for (const emi of schedule) {
            emi.status = 'PAID';
            emi.paymentDate = new Date(emi.dueDate.getTime() - 1 * 24 * 60 * 60 * 1000); // paid 1 day early
          }
        } else if (status === 'ACTIVE') {
          // First two EMIs (due in the past) are PAID or OVERDUE
          // Let's create overdue payments for high-risk loans
          for (let k = 0; k < schedule.length; k++) {
            const emi = schedule[k];
            const isPast = emi.dueDate < today;
            
            if (isPast) {
              if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
                // High risk has missed payments
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
              // Future EMIs
              emi.status = 'UPCOMING';
            }
          }
        }
        await Repayment.insertMany(schedule);
      }
    }

    console.log('Seeded repayments and audit logs successfully.');

    // 5. Update Farmer health scores based on newly generated repayment schedule
    const allFarmers = await Farmer.find({});
    const allLoans = await Loan.find({});
    const allRepayments = await Repayment.find({});

    for (const f of allFarmers) {
      const fLoans = allLoans.filter(l => l.farmerId.toString() === f._id.toString());
      const fRepayments = allRepayments.filter(r => r.farmerId.toString() === f._id.toString());

      // Simple score estimation logic matching the module
      let activeCount = fLoans.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status)).length;
      let completedCount = fLoans.filter(l => l.status === 'CLOSED').length;
      let overdueCount = fRepayments.filter(r => r.status === 'OVERDUE').length;

      let score = 70;
      if (completedCount > 0) score += 10;
      if (activeCount > 0) score += 5;
      score -= overdueCount * 20;

      // Ensure boundary
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
