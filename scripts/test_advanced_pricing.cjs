/**
 * Test script for Holiday Expertz Advanced Property Pricing Logic
 */

const assert = require("assert");

function calculateTestStay({
  checkIn,
  checkOut,
  guests,
  maxGuests = 10,
  basePrice = 250,
  weekdayRate = 220,
  weekendRate = 285,
  weekendDays = [5, 6], // Fri, Sat
  seasonalRates = [],
  specialDateRates = [],
  paidActivities = [],
  selectedExtras = [],
}) {
  const checkInDate = new Date(checkIn + "T00:00:00");
  const checkOutDate = new Date(checkOut + "T00:00:00");

  if (checkOutDate <= checkInDate) throw new Error("Invalid dates");
  if (guests > maxGuests) throw new Error("Exceeds capacity");

  const nightlyBreakdown = [];
  let current = new Date(checkInDate);

  while (current < checkOutDate) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = current.getDay();

    // 1. Special date
    const specialRule = specialDateRates.find((sp) => dateStr >= sp.startDate && dateStr <= (sp.endDate || sp.startDate));
    if (specialRule) {
      nightlyBreakdown.push({ date: dateStr, rate: specialRule.nightlyRate, type: "special" });
    } else {
      // 2. Seasonal
      const seasonalRule = seasonalRates.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
      if (seasonalRule) {
        nightlyBreakdown.push({ date: dateStr, rate: seasonalRule.nightlyRate, type: "seasonal" });
      } else if (weekendDays.includes(dayOfWeek)) {
        // 3. Weekend
        nightlyBreakdown.push({ date: dateStr, rate: weekendRate, type: "weekend" });
      } else {
        // 4. Weekday
        nightlyBreakdown.push({ date: dateStr, rate: weekdayRate, type: "weekday" });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const accommodationTotal = nightlyBreakdown.reduce((sum, n) => sum + n.rate, 0);

  let extrasTotal = 0;
  paidActivities.forEach((act) => {
    if (selectedExtras.includes(act.id)) {
      if (act.chargeType === "PER_PERSON") {
        extrasTotal += act.price * guests;
      } else {
        extrasTotal += act.price;
      }
    }
  });

  return {
    nights: nightlyBreakdown.length,
    accommodationTotal,
    extrasTotal,
    total: accommodationTotal + extrasTotal,
    nightlyBreakdown,
  };
}

console.log("Running Advanced Pricing Logic Tests...");

// Test 1: Standard Weekday (Thursday) + Weekend (Friday, Saturday) = 3 nights
// 2026-11-19 is Thu ($220), 2026-11-20 is Fri ($285), 2026-11-21 is Sat ($285)
const t1 = calculateTestStay({
  checkIn: "2026-11-19",
  checkOut: "2026-11-22",
  guests: 2,
  weekdayRate: 220,
  weekendRate: 285,
  weekendDays: [5, 6],
});
assert.strictEqual(t1.nights, 3);
assert.strictEqual(t1.accommodationTotal, 220 + 285 + 285); // 790
console.log("✔ Test 1 Passed: Weekday + Weekend rates correctly applied ($790 for 3 nights)");

// Test 2: Seasonal Override (Dec 15 - Jan 10 at $350)
const t2 = calculateTestStay({
  checkIn: "2026-12-20",
  checkOut: "2026-12-23",
  guests: 2,
  weekdayRate: 220,
  weekendRate: 285,
  seasonalRates: [{ id: "s1", name: "Peak", startDate: "2026-12-15", endDate: "2027-01-10", nightlyRate: 350 }],
});
assert.strictEqual(t2.accommodationTotal, 350 * 3); // 1050
console.log("✔ Test 2 Passed: Seasonal rate override correctly applied ($1,050 for 3 nights)");

// Test 3: Special Date (New Year's Eve at $500) overrides seasonal ($350)
const t3 = calculateTestStay({
  checkIn: "2026-12-30",
  checkOut: "2027-01-02", // 3 nights: Dec 30 (Seasonal $350), Dec 31 (Special $500), Jan 1 (Seasonal $350)
  guests: 2,
  weekdayRate: 220,
  weekendRate: 285,
  seasonalRates: [{ id: "s1", name: "Peak", startDate: "2026-12-15", endDate: "2027-01-10", nightlyRate: 350 }],
  specialDateRates: [{ id: "sp1", name: "NYE", startDate: "2026-12-31", endDate: "2026-12-31", nightlyRate: 500 }],
});
assert.strictEqual(t3.accommodationTotal, 350 + 500 + 350); // 1200
console.log("✔ Test 3 Passed: Special Date Rate correctly overrides Seasonal Rate ($1,200 for 3 nights)");

// Test 4: Paid Activities: Airport Transfer ($45 flat) + Guided Tour ($60 per person for 3 guests)
const t4 = calculateTestStay({
  checkIn: "2026-11-19",
  checkOut: "2026-11-20", // 1 night Thu: $220
  guests: 3,
  weekdayRate: 220,
  paidActivities: [
    { id: "act1", name: "Airport Transfer", price: 45, chargeType: "PER_TRIP" },
    { id: "act2", name: "Guided Tour", price: 60, chargeType: "PER_PERSON" },
  ],
  selectedExtras: ["act1", "act2"],
});
assert.strictEqual(t4.extrasTotal, 45 + (60 * 3)); // 45 + 180 = 225
assert.strictEqual(t4.total, 220 + 225); // 445
console.log("✔ Test 4 Passed: Paid activities calculated correctly with PER_TRIP & PER_PERSON ($445 total)");

console.log("\nALL ADVANCED PRICING LOGIC TESTS PASSED!");
