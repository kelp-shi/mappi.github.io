// 地図を初期化
const map = L.map("mapid", {
  minZoom: 3,
  maxZoom: 18,
}).setView([35.658, 139.745], 14);
map.setMaxBounds([
  [-85, -180], // 南西端
  [85, 180], // 北東端
]);

// OSMタイル追加
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// 世界を覆うような黒ポリゴン：
// ここでは簡単に大きめの矩形にしているが、本番では世界地図全体でもいい。
const outerBounds = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];

// "穴"を管理する配列
let holes = [];

// 黒ポリゴン(outerBounds) + 穴(holes)を合体するためのGeoJSON Polygon
let blackMask = L.polygon(outerBounds, {
  color: "black",
  fillColor: "black",
  fillOpacity: 1,
});

// いったんマップに追加
blackMask.addTo(map);

// 位置情報の監視をスタート
navigator.geolocation.watchPosition(
  (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    // 例：半径50mの円を穴として追加するとする（実際には多角形化が必要）
    // 正確には円をGeoJSONポリゴンに変換し、holes配列にpushする。
    const holeCircle = createCirclePolygon([lat, lon], 10);

    holes.push(holeCircle);

    // outerBounds (黒) から holes を差し引いた形のジオメトリを作成して再描画する
    const newGeoJson = createMaskWithHoles(outerBounds, holes);
    blackMask.setLatLngs(newGeoJson);
  },
  (err) => console.error(err),
  { enableHighAccuracy: true }
);

function createCirclePolygon(center, radiusMeter, segments = 36) {
  const lat = (center[0] * Math.PI) / 180; // 中心の緯度（ラジアン）
  const lng = (center[1] * Math.PI) / 180; // 中心の経度（ラジアン）
  const earthRadius = 6378137; // 地球の半径（メートル）
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const bearing = (((i * 360) / segments) * Math.PI) / 180;

    const latRad = Math.asin(
      Math.sin(lat) * Math.cos(radiusMeter / earthRadius) +
        Math.cos(lat) * Math.sin(radiusMeter / earthRadius) * Math.cos(bearing)
    );

    const lngRad =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(radiusMeter / earthRadius) * Math.cos(lat),
        Math.cos(radiusMeter / earthRadius) - Math.sin(lat) * Math.sin(latRad)
      );

    points.push([(latRad * 180) / Math.PI, (lngRad * 180) / Math.PI]);
  }

  return points;
}

function createMaskWithHoles(outer, holes) {
  if (!holes || holes.length === 0) {
    return [outer];
  }

  // 外枠 + 各穴の配列を連結して返す
  return [outer, ...holes];
}
