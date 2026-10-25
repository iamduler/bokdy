/**
 * Import GL CSS via static side-effect modules — Turbopack cannot resolve
 * dynamic CSS imports from map adapters. Prefer Vietmap (primary engine);
 * also load MapLibre for raster fallback.
 */
import "@/styles/vietmap-gl-base.css";
import "@/styles/maplibre-gl-base.css";
