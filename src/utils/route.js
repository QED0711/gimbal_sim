// Calculate the Haversine distance (in meters) between two geographic points.
export function haversineDistance(p1, p2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = angle => angle * Math.PI / 180;

    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);
    const deltaLat = toRad(p2.lat - p1.lat);
    const deltaLng = toRad(p2.lng - p1.lng);

    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert speed from miles per hour (mph) to meters per second (m/s).
function mphToMps(mph) {
    return mph * 0.44704;
}

// Interpolate between two points.
// 't' is a fraction between 0 and 1 (0 returns p1; 1 returns p2).
export function interpolatePoints(p1, p2, t) {
    return {
        lat: p1.lat + t * (p2.lat - p1.lat),
        lng: p1.lng + t * (p2.lng - p1.lng),
        alt: p1.alt + t * (p2.alt - p1.alt)
    };
}

// Extrapolate points between two points based on speed and update interval.
// updateInterval is in seconds (default 0.333 for 3Hz).
export function extrapolateSegment(p1, p2, speed, updateInterval = 0.333) {
    const speedMps = mphToMps(speed);
    const distance = haversineDistance(p1, p2);
    const stepDistance = speedMps * updateInterval;

    // Determine how many intervals are needed to cover the segment.
    const steps = Math.max(1, Math.ceil(distance / stepDistance));
    const points = [];

    // Generate points (including the start and end points).
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push(interpolatePoints(p1, p2, t));
    }
    return points;
}

// Extrapolate an entire route object.
// It takes an object with 'route' (an array of points) and 'speed' (in mph).
// Returns an array of interpolated points.
export function extrapolateRoute(routeObj, updateInterval = 0.333) {
    updateInterval = updateInterval > 1 ? updateInterval/1000 : updateInterval
    const { route, speed } = routeObj;
    let result = [];

    for (let i = 0; i < route.length - 1; i++) {
        // Get points for this segment.
        let segmentPoints = extrapolateSegment(route[i], route[i + 1], speed, updateInterval);
        // Avoid duplicating points at segment boundaries.
        if (i > 0) {
            segmentPoints.shift();
        }
        result = result.concat(segmentPoints);
    }
    result = addHeadingsToPoints(result)
    return result;
}

// Calculate heading (bearing) in degrees from point p1 to point p2.
export function calculateHeading(p1, p2) {
    const toRad = angle => angle * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    
    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);
    const deltaLng = toRad(p2.lng - p1.lng);
    
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    let bearing = toDeg(Math.atan2(y, x));
    // Normalize to 0-360
    return (bearing + 360) % 360;
}

// Add a 'heading' field to each point in the array.
// For each point (except the last), the heading is calculated toward the next point.
// The last point is assigned the same heading as the second-to-last.
export function addHeadingsToPoints(points) {
    if (points.length === 0) return points;
    for (let i = 0; i < points.length - 1; i++) {
        points[i].heading = calculateHeading(points[i], points[i + 1]);
    }
    // For the last point, use the heading from the previous point (or 0 if only one point).
    points[points.length - 1].heading = points.length > 1 ? points[points.length - 2].heading : 0;
    return points;
}