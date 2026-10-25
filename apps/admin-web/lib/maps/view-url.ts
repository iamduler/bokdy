/**
 * Build an external map deep-link from the provider template in GET /maps/config.
 * Placeholders: {lat} {lng}. UI must not hardcode a vendor host.
 */
export function mapsViewUrl(template: string, lat: number, lng: number): string {
  return template
    .replaceAll("{lat}", encodeURIComponent(String(lat)))
    .replaceAll("{lng}", encodeURIComponent(String(lng)));
}
