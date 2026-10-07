require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceCategory = require('../models/ServiceCategory');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const PricingRule = require('../models/PricingRule');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('DB_URL / MONGODB_URI is missing. Set it before running the seed script.');
    }

    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for database population...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      ProviderProfile.deleteMany({}),
      ServiceCategory.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Quote.deleteMany({}),
      Booking.deleteMany({}),
      Invoice.deleteMany({}),
      Review.deleteMany({}),
      Dispute.deleteMany({}),
      PricingRule.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing data.');

    // 1. Create Pricing Rules
    const pricingRule = await PricingRule.create({
      name: 'Standard Platform Pricing',
      platformFeePercentage: 10,
      urgencySurgeMultiplier: {
        low: 1.0,
        medium: 1.0,
        high: 1.25,
        emergency: 1.5
      },
      taxPercentage: 8.25,
      minimumBookingFee: 35,
      isActive: true
    });
    console.log('[Seed] Created Platform Pricing Rule.');

    // 2. Create Service Categories
    const categories = await ServiceCategory.insertMany([
      {
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Comprehensive plumbing diagnostics, leak repair, drain clearing, and pipe fixture installations.',
        icon: 'Wrench',
        basePrice: 65,
        hourlyRateEstimate: 65,
        popular: true,
        skillsList: ['Pipe Repair', 'Drain Cleaning', 'Leak Detection', 'Faucet & Fixture Installation', 'Water Heater Repair', 'Toilet Repair']
      },
      {
        name: 'Electrical Work',
        slug: 'electrical-work',
        description: 'Certified electrical troubleshooting, circuit breaker replacement, lighting fixtures, and safety audits.',
        icon: 'Zap',
        basePrice: 75,
        hourlyRateEstimate: 75,
        popular: true,
        skillsList: ['Wiring & Rewiring', 'Circuit Breaker Repair', 'Lighting Installation', 'Outlet & Switch Replacement', 'Electrical Safety Inspection']
      },
      {
        name: 'House Cleaning',
        slug: 'house-cleaning',
        description: 'Professional home sanitization, deep kitchen/bathroom cleaning, dusting, vacuuming, and move-out cleans.',
        icon: 'Sparkles',
        basePrice: 45,
        hourlyRateEstimate: 45,
        popular: true,
        skillsList: ['Deep Cleaning', 'Move-in/Move-out Cleaning', 'Kitchen & Bathroom Sanitization', 'Floor Care & Mopping', 'Window Washing']
      },
      {
        name: 'Appliance Repair',
        slug: 'appliance-repair',
        description: 'Specialized repairs for refrigerators, washers, dryers, dishwashers, ovens, and garbage disposals.',
        icon: 'Hammer',
        basePrice: 70,
        hourlyRateEstimate: 70,
        popular: true,
        skillsList: ['Refrigerator Repair', 'Washer & Dryer Servicing', 'Dishwasher Diagnostics', 'Oven & Stove Repair', 'Microwave Troubleshooting']
      },
      {
        name: 'HVAC & Maintenance',
        slug: 'hvac-maintenance',
        description: 'Heating and air conditioning tune-ups, filter changes, thermostat programming, and airflow optimization.',
        icon: 'Fan',
        basePrice: 80,
        hourlyRateEstimate: 80,
        popular: false,
        skillsList: ['AC Maintenance & Gas Refill', 'Furnace & Heater Repair', 'Thermostat Installation', 'Duct Cleaning', 'Air Filter Replacement']
      },
      {
        name: 'Carpentry & Handyman',
        slug: 'carpentry-handyman',
        description: 'Furniture assembly, drywall repairs, door hinge adjustments, TV mounting, and minor home repairs.',
        icon: 'CheckCircle',
        basePrice: 55,
        hourlyRateEstimate: 55,
        popular: false,
        skillsList: ['Furniture Assembly', 'Door & Lock Repair', 'Drywall Patching', 'Cabinet Repair', 'TV & Wall Mounting', 'Custom Shelving']
      }
    ]);
    console.log(`[Seed] Created ${categories.length} Service Categories.`);

    // 3. Create Users (Password: 'password123' for all demo accounts)
    const rawPassword = 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Staff Users
    const adminUser = await User.create({
      name: 'Victoria Vance (Admin)',
      email: 'admin@careconnect.com',
      password: rawPassword,
      role: 'admin',
      phone: '+1 (415) 800-1001',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      address: { street: '100 Platform Way', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    const opsUser = await User.create({
      name: 'Marcus Brody (Operations)',
      email: 'ops@careconnect.com',
      password: rawPassword,
      role: 'operations',
      phone: '+1 (415) 800-1002',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      address: { street: '100 Platform Way', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    const supportUser = await User.create({
      name: 'Sarah Chen (Support)',
      email: 'support@careconnect.com',
      password: rawPassword,
      role: 'support',
      phone: '+1 (415) 800-1003',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      address: { street: '100 Platform Way', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    // Customer Users
    const customer1 = await User.create({
      name: 'Alice Johnson',
      email: 'customer@careconnect.com', // default quick demo customer
      password: rawPassword,
      role: 'customer',
      phone: '+1 (415) 555-0142',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      address: { street: '452 Hayes St', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    const customer2 = await User.create({
      name: 'Robert Miller',
      email: 'robert@example.com',
      password: rawPassword,
      role: 'customer',
      phone: '+1 (415) 555-0188',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      address: { street: '890 Mission St', city: 'San Francisco', state: 'CA', zipCode: '94103' }
    });

    const customer3 = await User.create({
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password: rawPassword,
      role: 'customer',
      phone: '+1 (415) 555-0199',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      address: { street: '320 Pine St', city: 'San Francisco', state: 'CA', zipCode: '94104' }
    });

    // Provider Users
    const provider1User = await User.create({
      name: 'David Miller',
      email: 'provider@careconnect.com', // default quick demo provider
      password: rawPassword,
      role: 'provider',
      phone: '+1 (415) 555-7821',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      address: { street: '125 Valencia St', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    const provider2User = await User.create({
      name: 'Maria Santos',
      email: 'maria@careconnect.com',
      password: rawPassword,
      role: 'provider',
      phone: '+1 (415) 555-4392',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      address: { street: '782 Castro St', city: 'San Francisco', state: 'CA', zipCode: '94103' }
    });

    const provider3User = await User.create({
      name: 'James Reynolds',
      email: 'james@careconnect.com',
      password: rawPassword,
      role: 'provider',
      phone: '+1 (415) 555-9011',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      address: { street: '410 Bush St', city: 'San Francisco', state: 'CA', zipCode: '94104' }
    });

    const provider4User = await User.create({
      name: 'Carlos Mendez (Pending Verification)',
      email: 'pending@careconnect.com',
      password: rawPassword,
      role: 'provider',
      phone: '+1 (415) 555-3321',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      address: { street: '955 Market St', city: 'San Francisco', state: 'CA', zipCode: '94102' }
    });

    console.log('[Seed] Created all Users across 5 Roles.');

    // 4. Create Provider Profiles
    const plumbingCat = categories.find(c => c.slug === 'plumbing');
    const electricalCat = categories.find(c => c.slug === 'electrical-work');
    const cleaningCat = categories.find(c => c.slug === 'house-cleaning');
    const applianceCat = categories.find(c => c.slug === 'appliance-repair');
    const hvacCat = categories.find(c => c.slug === 'hvac-maintenance');

    // Provider 1: David Miller - Plumber (Verified)
    const p1Profile = await ProviderProfile.create({
      user: provider1User._id,
      businessName: 'Miller Pro Plumbing & Drainage',
      bio: 'Master Plumber with 9 years of residential and commercial plumbing experience. Fast emergency dispatch, leak detection, pipe relining, and fixture upgrades.',
      categories: [plumbingCat._id],
      skills: ['Pipe Repair', 'Drain Cleaning', 'Leak Detection', 'Faucet & Fixture Installation', 'Water Heater Repair'],
      hourlyRate: 65,
      experienceYears: 9,
      serviceAreas: ['94102', '94103', '94104', 'San Francisco'],
      verificationStatus: 'verified',
      verifiedBy: adminUser._id,
      verifiedAt: new Date(+new Date() - 30 * 24 * 60 * 60 * 1000),
      ratingAverage: 4.9,
      ratingCount: 19,
      completedJobsCount: 28,
      documents: [
        {
          docType: 'license',
          title: 'California C-36 Master Plumbing License',
          fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          status: 'approved'
        },
        {
          docType: 'insurance',
          title: 'Commercial General Liability $1M',
          fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
          status: 'approved'
        }
      ],
      availability: {
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '13:00', end: '16:00' },
          { start: '16:00', end: '19:00' }
        ]
      }
    });

    // Provider 2: Maria Santos - House Cleaning & Sanitization (Verified)
    const p2Profile = await ProviderProfile.create({
      user: provider2User._id,
      businessName: 'SparkleClean Green Home Services',
      bio: 'Eco-friendly, detail-oriented professional cleaning team. Specializing in deep move-in/out sanitization, kitchen detail, and pet-safe floor treatment.',
      categories: [cleaningCat._id],
      skills: ['Deep Cleaning', 'Move-in/Move-out Cleaning', 'Kitchen & Bathroom Sanitization', 'Floor Care & Mopping', 'Window Washing'],
      hourlyRate: 48,
      experienceYears: 5,
      serviceAreas: ['94102', '94103', '94104', '94105', 'San Francisco'],
      verificationStatus: 'verified',
      verifiedBy: adminUser._id,
      verifiedAt: new Date(+new Date() - 45 * 24 * 60 * 60 * 1000),
      ratingAverage: 5.0,
      ratingCount: 26,
      completedJobsCount: 35,
      documents: [
        {
          docType: 'insurance',
          title: 'Surety Bond & Cleaning Insurance Policy',
          fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
          status: 'approved'
        }
      ],
      availability: {
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        slots: [
          { start: '08:30', end: '12:30' },
          { start: '13:00', end: '17:00' }
        ]
      }
    });

    // Provider 3: James Reynolds - Electrical & Appliance Specialist (Verified)
    const p3Profile = await ProviderProfile.create({
      user: provider3User._id,
      businessName: 'Bay Volt Electrical & Appliance Fix',
      bio: 'Licensed C-10 Electrical contractor. Specializing in panel upgrades, smart switches, circuit troubleshooting, and high-end refrigerator diagnostics.',
      categories: [electricalCat._id, applianceCat._id],
      skills: ['Wiring & Rewiring', 'Circuit Breaker Repair', 'Lighting Installation', 'Refrigerator Repair', 'Dishwasher Diagnostics'],
      hourlyRate: 75,
      experienceYears: 7,
      serviceAreas: ['94102', '94103', '94104', 'San Francisco'],
      verificationStatus: 'verified',
      verifiedBy: adminUser._id,
      verifiedAt: new Date(+new Date() - 60 * 24 * 60 * 60 * 1000),
      ratingAverage: 4.8,
      ratingCount: 14,
      completedJobsCount: 21,
      documents: [
        {
          docType: 'license',
          title: 'CA C-10 Electrical License #982341',
          fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          status: 'approved'
        }
      ],
      availability: {
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '13:00', end: '16:00' },
          { start: '16:00', end: '19:00' }
        ]
      }
    });

    // Provider 4: Carlos Mendez - HVAC (Pending Verification for Admin demo)
    const p4Profile = await ProviderProfile.create({
      user: provider4User._id,
      businessName: 'Mendez Climate & Air Solutions',
      bio: 'Certified EPA universal technician ready to provide high efficiency AC maintenance, heat pump installations, and smart thermostat setups.',
      categories: [hvacCat._id],
      skills: ['AC Maintenance & Gas Refill', 'Furnace & Heater Repair', 'Thermostat Installation', 'Air Filter Replacement'],
      hourlyRate: 85,
      experienceYears: 4,
      serviceAreas: ['94102', '94103', 'San Francisco'],
      verificationStatus: 'pending',
      verificationNotes: 'Applicant uploaded trade certificate and general liability document. Awaiting admin document inspection.',
      documents: [
        {
          docType: 'license',
          title: 'EPA Section 608 Universal Certification',
          fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          status: 'pending'
        }
      ]
    });
    console.log('[Seed] Created Provider Profiles with skills and verification records.');

    // 5. Create Service Requests
    // Request 1: In-Progress Plumbing emergency (Customer: Alice)
    const req1 = await ServiceRequest.create({
      customer: customer1._id,
      category: plumbingCat._id,
      title: 'Kitchen sink pipe leaking water rapidly under cabinet',
      description: 'The hot water connection pipe under my kitchen sink started leaking profusely this morning. Water is collecting under the wooden cabinet and dripping onto the floor. Need urgent pipe repair and seal.',
      address: customer1.address,
      urgency: 'high',
      preferredDate: new Date(),
      preferredSlot: '09:00 - 12:00',
      budget: 130,
      aiClassification: {
        detectedCategoryName: 'Plumbing',
        suggestedSkills: ['Pipe Repair', 'Leak Detection', 'Drain Cleaning'],
        urgencyLevel: 'high',
        estimatedHours: 2,
        estimatedPriceRange: { min: 120, max: 180 },
        confidenceScore: 0.96
      },
      status: 'in_progress',
      assignedProvider: provider1User._id
    });

    // Request 2: Completed Electrical Job with Reviews & Evidence (Customer: Robert)
    const req2 = await ServiceRequest.create({
      customer: customer2._id,
      category: electricalCat._id,
      title: 'Circuit breaker tripping repeatedly in home office',
      description: 'Whenever I turn on the space heater and desktop PC at the same time, the 15A circuit breaker trips immediately. Looking to diagnose the circuit overload and replace/upgrade breaker safely.',
      address: customer2.address,
      urgency: 'medium',
      preferredDate: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000),
      preferredSlot: '13:00 - 16:00',
      budget: 150,
      aiClassification: {
        detectedCategoryName: 'Electrical Work',
        suggestedSkills: ['Circuit Breaker Repair', 'Wiring & Rewiring', 'Electrical Safety Inspection'],
        urgencyLevel: 'medium',
        estimatedHours: 2,
        estimatedPriceRange: { min: 140, max: 210 },
        confidenceScore: 0.94
      },
      status: 'completed',
      assignedProvider: provider3User._id
    });

    // Request 3: Disputed Appliance Repair (Customer: Elena)
    const req3 = await ServiceRequest.create({
      customer: customer3._id,
      category: applianceCat._id,
      title: 'Refrigerator compressor making loud buzzing sound and not cooling',
      description: 'Our Samsung double-door refrigerator is not cooling below 50 degrees Fahrenheit. The compressor clicks every 5 minutes and buzzes loudly. Food is spoiling.',
      address: customer3.address,
      urgency: 'high',
      preferredDate: new Date(+new Date() - 2 * 24 * 60 * 60 * 1000),
      preferredSlot: '16:00 - 19:00',
      budget: 160,
      aiClassification: {
        detectedCategoryName: 'Appliance Repair',
        suggestedSkills: ['Refrigerator Repair', 'Appliance Diagnostics'],
        urgencyLevel: 'high',
        estimatedHours: 2.5,
        estimatedPriceRange: { min: 150, max: 220 },
        confidenceScore: 0.95
      },
      status: 'disputed',
      assignedProvider: provider3User._id
    });

    // Request 4: Open Request waiting for quotes (Customer: Alice)
    const req4 = await ServiceRequest.create({
      customer: customer1._id,
      category: cleaningCat._id,
      title: 'Move-in Deep Cleaning for 2-Bedroom Condo',
      description: 'Moving into a new 1,100 sq ft apartment next Tuesday. Need deep sanitization of all kitchen cabinets, oven degreasing, bathroom descaling, and balcony floor mopping.',
      address: customer1.address,
      urgency: 'medium',
      preferredDate: new Date(+new Date() + 3 * 24 * 60 * 60 * 1000),
      preferredSlot: '09:00 - 12:00',
      budget: 140,
      aiClassification: {
        detectedCategoryName: 'House Cleaning',
        suggestedSkills: ['Deep Cleaning', 'Move-in/Move-out Cleaning', 'Kitchen & Bathroom Sanitization'],
        urgencyLevel: 'medium',
        estimatedHours: 3,
        estimatedPriceRange: { min: 120, max: 180 },
        confidenceScore: 0.97
      },
      status: 'quoted'
    });

    // Request 5: Unassigned Emergency Request (for Operations Manager demo)
    const req5 = await ServiceRequest.create({
      customer: customer2._id,
      category: plumbingCat._id,
      title: 'Main bathroom toilet overflow and backflow emergency',
      description: 'EMERGENCY: Toilet bowl is bubbling and water is backing up across the bathroom tile floor. The shut-off valve is stuck! Need urgent dispatch right away.',
      address: customer2.address,
      urgency: 'emergency',
      preferredDate: new Date(),
      preferredSlot: '13:00 - 16:00',
      budget: 190,
      aiClassification: {
        detectedCategoryName: 'Plumbing',
        suggestedSkills: ['Toilet Repair', 'Drain Cleaning', 'Leak Detection'],
        urgencyLevel: 'emergency',
        estimatedHours: 2,
        estimatedPriceRange: { min: 160, max: 250 },
        confidenceScore: 0.98
      },
      status: 'open'
    });

    console.log('[Seed] Created Service Requests with AI classification data.');

    // 6. Create Quotes for Request 4
    const quote1 = await Quote.create({
      request: req4._id,
      provider: provider2User._id,
      amount: 140,
      estimatedHours: 3,
      message: 'Hello Alice! SparkleClean Pros can provide a thorough 3-hour deep move-in sanitization using eco-friendly, hospital-grade cleaning solutions. All equipment and supplies included.',
      breakdown: [
        { description: 'Deep Sanitization & Cabinet Clean (3 hours)', amount: 120 },
        { description: 'Eco-friendly supplies & disinfectant materials', amount: 20 }
      ],
      status: 'pending'
    });

    console.log('[Seed] Created Quotes.');

    // 7. Create Bookings & Evidence
    // Booking 1: In Progress (Alice + David Miller)
    const booking1 = await Booking.create({
      request: req1._id,
      customer: customer1._id,
      provider: provider1User._id,
      category: plumbingCat._id,
      scheduledDate: new Date(),
      timeSlot: '09:00 - 12:00',
      serviceAddress: customer1.address,
      status: 'in_progress',
      pricing: {
        laborCost: 130,
        partsCost: 25,
        platformFee: 13,
        tax: 12.78,
        totalAmount: 180.78
      },
      trackingEvents: [
        {
          status: 'scheduled',
          note: 'Booking confirmed and scheduled with David Miller',
          timestamp: new Date(+new Date() - 3 * 60 * 60 * 1000),
          updatedBy: customer1._id
        },
        {
          status: 'en_route',
          note: 'Technician David Miller is en route. ETA: 15 minutes.',
          timestamp: new Date(+new Date() - 90 * 60 * 1000),
          updatedBy: provider1User._id
        },
        {
          status: 'in_progress',
          note: 'Arrived on-site. Shut off cold/hot supply valves, currently disassembling P-trap and replacing worn copper compression fitting.',
          timestamp: new Date(+new Date() - 40 * 60 * 1000),
          updatedBy: provider1User._id
        }
      ],
      evidence: {
        beforePhotos: [
          'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80'
        ],
        providerNotes: 'Identified severely corroded compression ring causing high-pressure spray under the sink cabinet.'
      }
    });

    // Invoice for Booking 1
    const invoice1 = await Invoice.create({
      invoiceNumber: 'INV-2026-001',
      booking: booking1._id,
      customer: customer1._id,
      provider: provider1User._id,
      items: [
        { description: 'Emergency Pipe Leak Diagnostic & Repair (2 hrs)', quantity: 1, unitPrice: 130, amount: 130 },
        { description: 'Replacement Brass Compression Fitting & O-Rings', quantity: 1, unitPrice: 25, amount: 25 }
      ],
      subtotal: 155,
      platformFee: 13,
      tax: 12.78,
      totalAmount: 180.78,
      paymentStatus: 'pending'
    });

    // Booking 2: Completed (Robert + James Reynolds) with Before & After evidence
    const booking2 = await Booking.create({
      request: req2._id,
      customer: customer2._id,
      provider: provider3User._id,
      category: electricalCat._id,
      scheduledDate: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000),
      timeSlot: '13:00 - 16:00',
      serviceAddress: customer2.address,
      status: 'completed',
      customerConfirmed: true,
      customerConfirmedAt: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      pricing: {
        laborCost: 150,
        partsCost: 35,
        platformFee: 15,
        tax: 15.26,
        totalAmount: 215.26
      },
      trackingEvents: [
        { status: 'scheduled', note: 'Booking confirmed', timestamp: new Date(+new Date() - 4 * 24 * 60 * 60 * 1000), updatedBy: customer2._id },
        { status: 'en_route', note: 'Technician en route', timestamp: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), updatedBy: provider3User._id },
        { status: 'in_progress', note: 'Panel inspection started', timestamp: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), updatedBy: provider3User._id },
        { status: 'completed', note: 'Replaced overloaded breaker with new Square D 20A tandem breaker, tested full circuit load safely.', timestamp: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), updatedBy: provider3User._id }
      ],
      evidence: {
        beforePhotos: [
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80'
        ],
        afterPhotos: [
          'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
        ],
        providerNotes: 'Faulty thermal overload mechanism on original breaker replaced. Load tested at 16.8 amps continuous with zero tripping.',
        submittedAt: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000)
      }
    });

    // Invoice for Booking 2 (Paid)
    const invoice2 = await Invoice.create({
      invoiceNumber: 'INV-2026-002',
      booking: booking2._id,
      customer: customer2._id,
      provider: provider3User._id,
      items: [
        { description: 'Electrical Diagnostic & Circuit Breaker Replacement', quantity: 1, unitPrice: 150, amount: 150 },
        { description: 'Square D 20A Heavy Duty Tandem Breaker', quantity: 1, unitPrice: 35, amount: 35 }
      ],
      subtotal: 185,
      platformFee: 15,
      tax: 15.26,
      totalAmount: 215.26,
      paymentStatus: 'paid',
      paidAt: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      transactionId: 'TXN-ELC94829'
    });

    // Review for Booking 2
    await Review.create({
      booking: booking2._id,
      customer: customer2._id,
      provider: provider3User._id,
      rating: 5,
      comment: 'James was phenomenal! Arrived exactly on time, diagnosed our electrical tripping issue within 15 minutes, replaced the breaker, and left the electrical closet immaculate. Highly recommend!',
      punctualityRating: 5,
      qualityRating: 5,
      cleanlinessRating: 5,
      providerReply: 'Thank you Robert! Glad we could ensure your home office circuit is running safe and reliable.'
    });

    // Booking 3: Disputed (Elena + James Reynolds)
    const booking3 = await Booking.create({
      request: req3._id,
      customer: customer3._id,
      provider: provider3User._id,
      category: applianceCat._id,
      scheduledDate: new Date(+new Date() - 2 * 24 * 60 * 60 * 1000),
      timeSlot: '16:00 - 19:00',
      serviceAddress: customer3.address,
      status: 'disputed',
      pricing: {
        laborCost: 160,
        partsCost: 0,
        platformFee: 16,
        tax: 14.52,
        totalAmount: 190.52
      },
      trackingEvents: [
        { status: 'scheduled', note: 'Booking confirmed', timestamp: new Date(+new Date() - 3 * 24 * 60 * 60 * 1000), updatedBy: customer3._id },
        { status: 'completed', note: 'Technician marked complete, replaced relay switch', timestamp: new Date(+new Date() - 2 * 24 * 60 * 60 * 1000), updatedBy: provider3User._id },
        { status: 'disputed', note: 'Dispute filed by Elena Rostova: Refrigerator still not cooling below 52 degrees', timestamp: new Date(+new Date() - 1 * 24 * 60 * 60 * 1000), updatedBy: customer3._id }
      ]
    });

    // Invoice for Booking 3 (Paid initially, now in dispute)
    const invoice3 = await Invoice.create({
      invoiceNumber: 'INV-2026-003',
      booking: booking3._id,
      customer: customer3._id,
      provider: provider3User._id,
      items: [
        { description: 'Samsung Refrigerator Compressor & Starter Relay Diagnostic', quantity: 1, unitPrice: 160, amount: 160 }
      ],
      subtotal: 160,
      platformFee: 16,
      tax: 14.52,
      totalAmount: 190.52,
      paymentStatus: 'disputed',
      paidAt: new Date(+new Date() - 2 * 24 * 60 * 60 * 1000),
      transactionId: 'TXN-REF77122'
    });

    // Dispute record on Booking 3
    const dispute1 = await Dispute.create({
      booking: booking3._id,
      raisedBy: customer3._id,
      against: provider3User._id,
      reason: 'unfinished_work',
      description: 'The technician came and replaced a starter relay, saying the fridge was fixed. 24 hours later, our refrigerator is still warm (52°F) and milk has spoiled. The underlying compressor or freon leak was not resolved.',
      desiredOutcome: 'partial_refund',
      evidence: [
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80'
      ],
      status: 'under_review',
      assignedAgent: supportUser._id,
      messages: [
        {
          sender: customer3._id,
          message: 'The fridge is still not cooling. I would like a refund or a return visit to properly fix the compressor.',
          createdAt: new Date(+new Date() - 24 * 60 * 60 * 1000)
        },
        {
          sender: provider3User._id,
          message: 'Hi Elena, the starter relay had definitely burned out and needed replacement. However, if the compressor coils are still failing to build pressure, the sealed system might require a full recharge.',
          createdAt: new Date(+new Date() - 18 * 60 * 60 * 1000)
        },
        {
          sender: supportUser._id,
          message: 'Support Agent Sarah Chen here. I am reviewing the diagnostic report and invoice. We can either arrange a follow-up warranty visit with zero diagnostic fee or issue a $100 partial refund on the labor.',
          createdAt: new Date(+new Date() - 6 * 60 * 60 * 1000)
        }
      ]
    });

    console.log('[Seed] Created Bookings, Invoices, Reviews, and Disputes.');

    // 8. Notifications
    await Notification.insertMany([
      {
        user: customer1._id,
        title: 'Technician In Progress',
        message: 'David Miller has arrived and is performing leak repair on your kitchen sink.',
        type: 'booking',
        link: `/customer/bookings/${booking1._id}`,
        isRead: false
      },
      {
        user: customer1._id,
        title: 'New Quote Available',
        message: 'Maria Santos submitted a $140 quote for your Move-in Deep Cleaning request.',
        type: 'quote',
        link: `/customer/requests/${req4._id}`,
        isRead: false
      },
      {
        user: provider1User._id,
        title: 'Active Job Scheduled Today',
        message: 'You have an active job scheduled for 09:00 - 12:00 at 452 Hayes St.',
        type: 'booking',
        link: `/provider/bookings/${booking1._id}`,
        isRead: true
      },
      {
        user: supportUser._id,
        title: 'New Dispute Escalated',
        message: 'Elena Rostova opened a dispute on Booking #INV-2026-003.',
        type: 'dispute',
        link: `/support/disputes/${dispute1._id}`,
        isRead: false
      }
    ]);

    // 9. Audit Logs
    await AuditLog.insertMany([
      {
        action: 'PLATFORM_SEED_COMPLETED',
        performedBy: adminUser._id,
        targetResource: 'System',
        details: { version: '1.0.0', environment: 'development' }
      },
      {
        action: 'PROVIDER_VERIFIED',
        performedBy: adminUser._id,
        targetResource: 'ProviderProfile',
        targetId: p1Profile._id,
        details: { provider: 'David Miller', licenseChecked: true }
      },
      {
        action: 'BOOKING_STATUS_IN_PROGRESS',
        performedBy: provider1User._id,
        targetResource: 'Booking',
        targetId: booking1._id,
        details: { status: 'in_progress' }
      }
    ]);

    console.log('[Seed] Database successfully seeded with realistic MERN capstone data!');
    console.log('---------------------------------------------------------');
    console.log('DEMO ACCOUNTS (Password for all accounts: "password123"):');
    console.log('1. Platform Admin:      admin@careconnect.com');
    console.log('2. Operations Manager:  ops@careconnect.com');
    console.log('3. Support Agent:       support@careconnect.com');
    console.log('4. Service Provider:    provider@careconnect.com');
    console.log('5. Customer:            customer@careconnect.com');
    console.log('---------------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
