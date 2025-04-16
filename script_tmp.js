// 地図を初期化
const map = L.map("mapid", {
  minZoom: 3,
  maxZoom: 18,
}).setView([35.658, 139.745], 14);
map.setMaxBounds([
  [-85, -180], // 南西端
  [85, 180],   // 北東端
]);

// OSMタイル追加
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// 世界を覆う黒いマスク用の外枠
const outerBounds = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];

// "穴"を管理する配列
let holes = [];

// 黒いマスクポリゴンを作成（初期は穴なし）
let blackMask = L.polygon(outerBounds, {
  color: "black",
  fillColor: "black",
  fillOpacity: 1,
});
blackMask.addTo(map);

let marker;
let lastHoleCenter = null;

// 位置情報の監視をスタート
navigator.geolocation.watchPosition(
  (pos) => {
    console.log("位置情報取得");
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const currentCenter = [lat, lon];

    // 移動距離が非常に小さい場合は新たな穴を追加しない（例：50m未満ならスキップ）
    if (lastHoleCenter) {
      const distance = map.distance(lastHoleCenter, currentCenter);
      if (distance < 50) {
        console.log("移動距離が短いため、穴は追加しません。");
      } else {
        addHole(currentCenter);
        lastHoleCenter = currentCenter;
      }
    } else {
      // 初回は必ず追加
      addHole(currentCenter);
      lastHoleCenter = currentCenter;
    }

    // 黒マスクの更新（穴の向きを反転して正しい穴とする）
    const newGeoJson = createMaskWithHoles(outerBounds, holes);
    blackMask.setLatLngs(newGeoJson);
    console.log("マスク更新完了");

    // マーカーの更新
    if (marker) {
      marker.setLatLng(currentCenter);
    } else {
      marker = L.marker(currentCenter).addTo(map);
    }

    // 現在地に地図を移動
    map.setView(currentCenter, map.getZoom());
  },
  (err) => console.error(err),
  { enableHighAccuracy: true }
);

// 新たな穴（円）を追加する処理
function addHole(center) {
  // 半径50mの円（穴）の多角形を生成
  let holeCircle = createCirclePolygon(center, 50);
  // ※ ここで穴として扱うために、座標の向きを反転（逆順）させる
  holeCircle = holeCircle.slice().reverse();
  holes.push(holeCircle);
  console.log("新しい穴を追加:", center);
}

/**
 * 中心座標(center)と半径(radiusMeter)から円形を多角形（配列形式）で生成する関数
 */
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

/**
 * 外枠(outer)と穴(holes)の座標配列から、穴付きポリゴン用の座標配列を作成する関数
 * Leafletでは、ポリゴンの最初の配列が外枠、その後が穴として扱われる
 */
function createMaskWithHoles(outer, holes) {
  if (!holes || holes.length === 0) {
    return [outer];
  }
  // 既に addHole() 内で穴の座標を反転しているので、そのまま連結
  return [outer, ...holes];
}
