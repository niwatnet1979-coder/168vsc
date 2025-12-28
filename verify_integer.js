const { calculateDistance, SHOP_LAT, SHOP_LON } = require('./lib/utils');

const lat = 13.7563;
const lon = 100.5018;

const dist = calculateDistance(SHOP_LAT, SHOP_LON, lat, lon);
console.log('Calculated Distance:', dist);
console.log('Type:', typeof dist);

if (Number.isInteger(dist)) {
    console.log('✅ SUCCESS: Distance is an integer.');
} else {
    console.log('❌ FAILURE: Distance is NOT an integer.');
}

// Test formatting logic
function formatDistance(dist) {
    if (typeof dist === 'number') {
        return "📍 " + Math.round(dist) + " km";
    }
    return dist;
}

console.log('Formatted Distance (123.45):', formatDistance(123.45));
console.log('Formatted Distance (123):', formatDistance(123));
