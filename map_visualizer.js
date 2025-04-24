// leafletMap.js
export function initLeafletMap() {
  const map = L.map("map_leaflet", {
    center: [35.41067, 139.45101],
    zoom: 17,
  });

  // タイルレイヤの追加
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
}