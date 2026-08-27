/**
 * Export Places to GPX (GPS Exchange Format) and KML (Google Earth/Garmin)
 */

interface PlaceItem {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  notes?: string;
  visitedAt: string;
}

export function exportToGPX(places: PlaceItem[]): string {
  const waypoints = places
    .map(
      (p) => `
  <wpt lat="${p.latitude}" lon="${p.longitude}">
    <name>${escapeXml(p.name)}</name>
    <desc>${escapeXml(p.notes || "")}</desc>
    <type>${escapeXml(p.type)}</type>
    <time>${p.visitedAt}</time>
  </wpt>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Jejak.log" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Jejak.log Eksplorasi</name>
    <time>${new Date().toISOString()}</time>
  </metadata>${waypoints}
</gpx>`;
}

export function exportToKML(places: PlaceItem[]): string {
  const placemarks = places
    .map(
      (p) => `
    <Placemark>
      <name>${escapeXml(p.name)}</name>
      <description>${escapeXml(p.notes || "")} [Kategori: ${escapeXml(p.type)}]</description>
      <Point>
        <coordinates>${p.longitude},${p.latitude},0</coordinates>
      </Point>
    </Placemark>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Jejak.log Eksplorasi</name>
    <description>Export Singgahan Peta Digital Jejak.log</description>${placemarks}
  </Document>
</kml>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
