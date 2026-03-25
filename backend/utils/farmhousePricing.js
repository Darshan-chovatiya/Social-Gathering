const calculateFarmhousePrice = (farmhouse, checkInDate, checkOutDate) => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // Helper to get tier for a date
  const getTierForDate = (date) => {
    if (farmhouse.festivalDates && farmhouse.festivalDates.some(fd => 
      new Date(fd).toISOString().split('T')[0] === date.toISOString().split('T')[0]
    )) {
      return 'festival';
    }
    const day = date.getDay();
    if (day === 0 || day === 6) return 'weekend';
    return 'regular';
  };

  const diffTime = Math.abs(end - start);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const _rateType = diffDays === 0 ? 'rate12h' : 'rate24h';
  let subtotal = 0;

  if (_rateType === 'rate12h') {
    // For 12h, we charge for the same day (or each day if multi-day 12h)
    for (let i = 0; i <= diffDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const tier = getTierForDate(current);
      subtotal += farmhouse.pricing[tier].rate12h || 0;
    }
  } else {
    // For 24h, we charge per night (periods)
    const periods = Math.max(1, diffDays);
    for (let i = 0; i < periods; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const tier = getTierForDate(current);
      subtotal += farmhouse.pricing[tier].rate24h || 0;
    }
  }

  let depositAmount = 0;
  if (farmhouse.deposit.type === 'percentage') {
    depositAmount = (subtotal * farmhouse.deposit.value) / 100;
  } else {
    depositAmount = farmhouse.deposit.value;
  }

  return { 
    subtotal, 
    depositAmount, 
    rateType: _rateType, 
    days: diffDays,
    primaryTier: getTierForDate(start)
  };
};

module.exports = { calculateFarmhousePrice };
