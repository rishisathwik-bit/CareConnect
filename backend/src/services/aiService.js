/**
 * CareConnect AI Smart Assistance Engine
 * - Free-text service request classification (Category, skills, urgency, price/time estimation)
 * - Multi-factor provider matching and ranking engine
 */

const CATEGORY_KNOWLEDGE_BASE = [
  {
    categoryName: 'Plumbing',
    slug: 'plumbing',
    keywords: ['plumb', 'pipe', 'leak', 'drain', 'faucet', 'sink', 'toilet', 'shower', 'clog', 'water heater', 'sewer', 'tap', 'flush', 'drip', 'overflow', 'plumber'],
    skills: ['Pipe Repair', 'Drain Cleaning', 'Leak Detection', 'Faucet & Fixture Installation', 'Water Heater Repair', 'Toilet Repair'],
    basePrice: 65,
    avgHours: 2
  },
  {
    categoryName: 'Electrical Work',
    slug: 'electrical-work',
    keywords: ['electric', 'wire', 'wiring', 'spark', 'short circuit', 'breaker', 'switch', 'outlet', 'lighting', 'light', 'chandelier', 'fuse', 'socket', 'shock', 'power outage'],
    skills: ['Wiring & Rewiring', 'Circuit Breaker Repair', 'Lighting Installation', 'Outlet & Switch Replacement', 'Electrical Safety Inspection'],
    basePrice: 75,
    avgHours: 2.5
  },
  {
    categoryName: 'House Cleaning',
    slug: 'house-cleaning',
    keywords: ['clean', 'dust', 'mop', 'sweep', 'vacuum', 'scrub', 'sanitize', 'maid', 'deep clean', 'move-in', 'move-out', 'kitchen cleaning', 'bathroom cleaning', 'window cleaning', 'disinfect'],
    skills: ['Deep Cleaning', 'Move-in/Move-out Cleaning', 'Kitchen & Bathroom Sanitization', 'Floor Care & Mopping', 'Window Washing'],
    basePrice: 45,
    avgHours: 3
  },
  {
    categoryName: 'Appliance Repair',
    slug: 'appliance-repair',
    keywords: ['appliance', 'refrigerator', 'fridge', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave', 'freezer', 'ice maker', 'garbage disposal', 'washing machine'],
    skills: ['Refrigerator Repair', 'Washer & Dryer Servicing', 'Dishwasher Diagnostics', 'Oven & Stove Repair', 'Microwave Troubleshooting'],
    basePrice: 70,
    avgHours: 2
  },
  {
    categoryName: 'HVAC & Maintenance',
    slug: 'hvac-maintenance',
    keywords: ['ac', 'air condition', 'air conditioner', 'heat', 'heater', 'hvac', 'thermostat', 'furnace', 'vent', 'ventilation', 'filter', 'cooling', 'duct', 'freon'],
    skills: ['AC Maintenance & Gas Refill', 'Furnace & Heater Repair', 'Thermostat Installation', 'Duct Cleaning', 'Air Filter Replacement'],
    basePrice: 80,
    avgHours: 2.5
  },
  {
    categoryName: 'Carpentry & Handyman',
    slug: 'carpentry-handyman',
    keywords: ['carpenter', 'wood', 'door', 'lock', 'furniture', 'shelf', 'hinge', 'cabinet', 'drywall', 'patch', 'paint', 'frame', 'handyman', 'assembly', 'mount', 'tv mount'],
    skills: ['Furniture Assembly', 'Door & Lock Repair', 'Drywall Patching', 'Cabinet Repair', 'TV & Wall Mounting', 'Custom Shelving'],
    basePrice: 55,
    avgHours: 2
  }
];

const URGENCY_TRIGGERS = {
  emergency: ['emergency', 'burst', 'flood', 'flooding', 'sparking', 'sparks', 'fire hazard', 'gas smell', 'immediate', 'asap', 'hazard', 'severe leak'],
  high: ['urgent', 'today', 'quick', 'overflowing', 'not working', 'completely broken', 'broken down', 'cannot use', 'stopped working'],
  medium: ['soon', 'this week', 'maintenance', 'repair', 'needs check', 'slowly'],
  low: ['whenever', 'planning', 'next week', 'quote only', 'estimate', 'routine']
};

/**
 * Classify a customer's free-text service request
 */
async function classifyServiceRequest(freeText) {
  if (!freeText || typeof freeText !== 'string') {
    return {
      categoryName: 'Plumbing',
      categorySlug: 'plumbing',
      suggestedSkills: ['General Repair'],
      urgencyLevel: 'medium',
      estimatedHours: 2,
      estimatedPriceRange: { min: 80, max: 150 },
      confidenceScore: 0.7
    };
  }

  const textLower = freeText.toLowerCase();

  // 1. Detect Urgency
  let detectedUrgency = 'medium';
  for (const [level, triggers] of Object.entries(URGENCY_TRIGGERS)) {
    if (triggers.some(trigger => textLower.includes(trigger))) {
      detectedUrgency = level;
      break;
    }
  }

  // 2. Score Categories based on keyword matches
  let bestMatch = CATEGORY_KNOWLEDGE_BASE[0];
  let highestScore = 0;
  let matchedSkills = [];

  for (const cat of CATEGORY_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (textLower.includes(kw)) {
        score += kw.length > 5 ? 3 : 2; // longer keywords have more weight
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = cat;
    }
  }

  // 3. Extract relevant skills for the best matching category
  for (const skill of bestMatch.skills) {
    const skillWords = skill.toLowerCase().split(' ');
    const hasMatch = skillWords.some(word => word.length > 3 && textLower.includes(word));
    if (hasMatch) {
      matchedSkills.push(skill);
    }
  }

  // Default to at least top 2 skills if none specifically isolated
  if (matchedSkills.length === 0) {
    matchedSkills = bestMatch.skills.slice(0, 2);
  }

  const confidenceScore = Math.min(0.98, Math.max(0.72, (highestScore * 0.1) + 0.65));
  const estimatedHours = bestMatch.avgHours;
  const urgencyMultiplier = detectedUrgency === 'emergency' ? 1.5 : detectedUrgency === 'high' ? 1.25 : 1.0;
  const baseRate = bestMatch.basePrice;
  const estimatedMin = Math.round(baseRate * estimatedHours * urgencyMultiplier);
  const estimatedMax = Math.round(estimatedMin * 1.4);

  return {
    categoryName: bestMatch.categoryName,
    categorySlug: bestMatch.slug,
    suggestedSkills: matchedSkills,
    urgencyLevel: detectedUrgency,
    estimatedHours,
    estimatedPriceRange: {
      min: estimatedMin,
      max: estimatedMax
    },
    confidenceScore: Math.round(confidenceScore * 100) / 100
  };
}

/**
 * Multi-factor ranking algorithm for matching providers to a request
 */
function rankProviders(requestDetails, providersList) {
  const { categoryId, categoryName, skills = [], address = {}, preferredSlot, preferredDate } = requestDetails;
  const reqZip = (address.zipCode || '').trim();
  const reqCity = (address.city || '').toLowerCase().trim();

  const scoredProviders = providersList.map(item => {
    // Provider item might be populated ProviderProfile or user with profile
    const profile = item.profile || item;
    const user = item.user || item;

    let score = 0;
    const matchReasons = [];

    // 1. Skill Match (Weight: 40 points)
    const providerSkills = (profile.skills || []).map(s => s.toLowerCase());
    let matchingSkillCount = 0;

    if (skills.length > 0) {
      skills.forEach(s => {
        if (providerSkills.some(ps => ps.includes(s.toLowerCase()) || s.toLowerCase().includes(ps))) {
          matchingSkillCount++;
        }
      });
      const skillRatio = matchingSkillCount / skills.length;
      const skillScore = Math.round(skillRatio * 40);
      score += skillScore;
      if (matchingSkillCount > 0) {
        matchReasons.push(`${matchingSkillCount}/${skills.length} required skills matched`);
      }
    } else {
      score += 30; // base score if no specific skills specified
    }

    // 2. Service Area Proximity Match (Weight: 25 points)
    const areas = (profile.serviceAreas || []).map(a => a.toLowerCase().trim());
    let areaMatched = false;
    if (areas.length > 0) {
      if (reqZip && areas.includes(reqZip)) {
        score += 25;
        areaMatched = true;
        matchReasons.push(`Direct coverage for Zipcode ${reqZip}`);
      } else if (reqCity && areas.some(a => a.includes(reqCity))) {
        score += 20;
        areaMatched = true;
        matchReasons.push(`Serves ${address.city || 'your area'}`);
      } else {
        score += 10; // general regional availability
      }
    } else {
      score += 15;
    }

    // 3. Rating & Historical Performance (Weight: 20 points)
    const rating = profile.ratingAverage || 5.0;
    const ratingScore = Math.round((rating / 5.0) * 15);
    score += ratingScore;

    const reviewCount = profile.ratingCount || 0;
    const jobsCount = profile.completedJobsCount || 0;
    if (reviewCount >= 5 || jobsCount >= 10) {
      score += 5;
      matchReasons.push(`Top Rated (${rating.toFixed(1)} ★, ${jobsCount} jobs completed)`);
    } else {
      score += 2;
    }

    // 4. Verification & Experience (Weight: 10 points)
    if (profile.verificationStatus === 'verified') {
      score += 7;
      matchReasons.push('Verified & Background Checked');
    }
    if ((profile.experienceYears || 0) >= 3) {
      score += 3;
      matchReasons.push(`${profile.experienceYears}+ years experience`);
    }

    // 5. Availability (Weight: 5 points)
    if (profile.availability && profile.availability.slots) {
      score += 5;
      matchReasons.push('Flexible scheduling slots available');
    }

    const finalScore = Math.min(99, Math.max(45, score));

    return {
      provider: user,
      profile,
      matchScore: finalScore,
      matchReasons
    };
  });

  // Sort descending by matchScore
  return scoredProviders.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  classifyServiceRequest,
  rankProviders,
  CATEGORY_KNOWLEDGE_BASE
};
