const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const MAX_RESULTS = 10;

function toRad(d) {
  return d * Math.PI / 180;
}

function kmDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cleanAddress(tags = {}) {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean).join(', ') || tags['addr:full'] || '';
}

router.get('/nearby', authenticate, async (req, res) => {
  const address = String(req.query.address || '').trim();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasCoords && (!address || address.length < 3)) {
    return res.status(400).json({ error: 'provide address or lat/lng query params' });
  }

  try {
    let originLat = lat;
    let originLon = lng;
    let originAddress = address || 'Current Location';

    if (!hasCoords) {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': 'FoodShare/1.0 (community food rescue app)' }
      });
      const geoData = await geoRes.json();
      if (!geoData?.[0]) return res.json({ origin: null, centers: [] });
      originLat = Number(geoData[0].lat);
      originLon = Number(geoData[0].lon);
      originAddress = address;
    }

    const query = `
      [out:json][timeout:25];
      (
        node(around:12000,${originLat},${originLon})["office"="ngo"];
        way(around:12000,${originLat},${originLon})["office"="ngo"];
        relation(around:12000,${originLat},${originLon})["office"="ngo"];
        node(around:12000,${originLat},${originLon})["amenity"="social_facility"];
        way(around:12000,${originLat},${originLon})["amenity"="social_facility"];
        relation(around:12000,${originLat},${originLon})["amenity"="social_facility"];
      );
      out center tags 120;
    `;

    const opRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'FoodShare/1.0 (community food rescue app)'
      },
      body: `data=${encodeURIComponent(query)}`
    });
    const opData = await opRes.json();

    const rows = (opData?.elements || []).map((el) => {
      const tags = el.tags || {};
      const lat = Number(el.lat || el.center?.lat);
      const lon = Number(el.lon || el.center?.lon);
      const phone = tags['contact:phone'] || tags.phone || tags['contact:mobile'] || '';
      return {
        name: tags.name || 'Support Center',
        type: tags['social_facility'] || tags['social_facility:for'] || tags.amenity || tags.office || 'community_support',
        address: cleanAddress(tags),
        phone,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lon) ? lon : null,
        distance_km: Number.isFinite(lat) && Number.isFinite(lon) ? Number(kmDistance(originLat, originLon, lat, lon).toFixed(2)) : null
      };
    });

    const deduped = [];
    const seen = new Set();
    for (const row of rows.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))) {
      const key = `${row.name.toLowerCase()}|${(row.address || '').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
      if (deduped.length >= MAX_RESULTS) break;
    }

    res.json({
      origin: { address: originAddress, latitude: originLat, longitude: originLon },
      centers: deduped
    });
  } catch (err) {
    console.error('support-centers/nearby failed:', err);
    res.status(502).json({ error: 'Failed to fetch nearby support centers' });
  }
});

module.exports = router;
