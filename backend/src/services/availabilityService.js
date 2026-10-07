const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Check if a provider is available for a given date and slot
 */
async function checkSlotAvailability(providerId, dateInput, timeSlot) {
  const targetDate = new Date(dateInput);
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // 1. Fetch provider profile
  const profile = await ProviderProfile.findOne({ user: providerId });
  if (!profile) {
    return { isAvailable: false, reason: 'Provider profile not found' };
  }

  // 2. Check working days
  const dayOfWeek = DAY_MAP[targetDate.getDay()];
  if (profile.availability && profile.availability.workingDays) {
    if (!profile.availability.workingDays.includes(dayOfWeek)) {
      return { isAvailable: false, reason: `Provider does not work on ${dayOfWeek}s` };
    }
  }

  // 3. Check blackout dates
  if (profile.availability && profile.availability.blackoutDates) {
    const isBlackout = profile.availability.blackoutDates.some(bDate => {
      const b = new Date(bDate);
      b.setHours(0, 0, 0, 0);
      return b.getTime() === targetDate.getTime();
    });
    if (isBlackout) {
      return { isAvailable: false, reason: 'Provider has marked this date as unavailable' };
    }
  }

  // 4. Strict Conflict Detection: Check for overlapping active bookings
  const existingBooking = await Booking.findOne({
    provider: providerId,
    scheduledDate: {
      $gte: targetDate,
      $lt: nextDate
    },
    timeSlot: timeSlot,
    status: { $in: ['scheduled', 'en_route', 'in_progress'] }
  });

  if (existingBooking) {
    return {
      isAvailable: false,
      reason: `Slot ${timeSlot} on this date is already booked with another job`
    };
  }

  return { isAvailable: true };
}

/**
 * Get available slots for a provider on a specific date
 */
async function getProviderAvailableSlots(providerId, dateInput) {
  const targetDate = new Date(dateInput);
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const profile = await ProviderProfile.findOne({ user: providerId });
  if (!profile) {
    return [];
  }

  const dayOfWeek = DAY_MAP[targetDate.getDay()];
  const isWorkingDay = profile.availability?.workingDays ? profile.availability.workingDays.includes(dayOfWeek) : true;

  const defaultSlots = [
    { start: '09:00', end: '12:00', label: '09:00 - 12:00' },
    { start: '13:00', end: '16:00', label: '13:00 - 16:00' },
    { start: '16:00', end: '19:00', label: '16:00 - 19:00' }
  ];

  const configuredSlots = (profile.availability?.slots && profile.availability.slots.length > 0)
    ? profile.availability.slots.map(s => ({
        start: s.start,
        end: s.end,
        label: `${s.start} - ${s.end}`
      }))
    : defaultSlots;

  // Find booked slots for this date
  const bookedBookings = await Booking.find({
    provider: providerId,
    scheduledDate: {
      $gte: targetDate,
      $lt: nextDate
    },
    status: { $in: ['scheduled', 'en_route', 'in_progress'] }
  }).select('timeSlot');

  const bookedSlotLabels = new Set(bookedBookings.map(b => b.timeSlot));

  return configuredSlots.map(slot => ({
    ...slot,
    isAvailable: isWorkingDay && !bookedSlotLabels.has(slot.label)
  }));
}

module.exports = {
  checkSlotAvailability,
  getProviderAvailableSlots
};
