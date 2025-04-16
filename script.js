// Leafletによるマップの描画
const map = L.map("map_leaflet", {
  center: [35.658584, 139.7454316], // 東京タワーの緯度経度
  zoom: 17,
});

// OpenStreetMapタイルレイヤの追加
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// グローバル変数
let num = 0;
let watch_id;
let marker; // 現在地マーカー用
let jsonDate = {};
let nowSession; // 現在の最新セッション番号

// 初回読み込み時に既存の mapping.json のデータを読み込み、ポリラインを表示
fetch("./mapping.json")
  .then((response) => response.json())
  .then((data) => {
    // mapping.json はセッションデータの配列として扱う
    // 今回の実装では最新のセッション番号を求めたいと仮定
    if (!Array.isArray(data)) {
      console.error("mapping.jsonは配列形式である必要があります。");
      return;
    }
    // 例として最新のセッション番号を取得する（配列の最後の要素を想定）
    nowSession = data.length > 0 ? data[data.length - 1].session : 0;

    // ここでは全セッションの座標を1本のポリラインで描画（必要に応じて調整）
    // 全セッションのすべての座標をまとめる例
    const allCoordinates = data.reduce((acc, session) => {
      return acc.concat(session.coordinates);
    }, []);

    const latLngs = allCoordinates.map((coordinate) => [
      coordinate.lat,
      coordinate.lon,
    ]);
    L.polyline(latLngs, { color: "blue" }).addTo(map);
  })
  .catch((error) => console.error("Error fetching JSON:", error));

// 「.test」ボタンで新しいセッションの記録を開始
const testBtn = document.querySelector(".test");
const list = document.querySelector("ul"); // 座標のリスト表示用

testBtn.addEventListener("click", function () {
  // 新セッション開始：既存の最新セッション番号に＋1
  jsonDate = {
    session: nowSession + 1,
    coordinates: [],
  };

  // 位置情報のウォッチ開始
  watch_id = navigator.geolocation.watchPosition(
    test2,
    function (error) {
      alert(error.message);
    },
    {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 2000,
    }
  );
});

// 位置情報取得時のコールバック
function test2(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // 取得した座標やその他情報をテキストとして作成
  let geo_text = `緯度: ${lat}\n経度: ${lon}\n高度: ${position.coords.altitude}\n`;
  geo_text += `位置精度: ${position.coords.accuracy}\n高度精度: ${position.coords.altitudeAccuracy}\n`;
  geo_text += `移動方向: ${position.coords.heading}\n速度: ${position.coords.speed}\n`;
  const date = new Date(position.timestamp);
  geo_text += `取得時刻: ${date.toLocaleString()}\n取得回数: ${++num}\n`;

  // 画面の表示更新
  document.getElementById("position_view").innerHTML = geo_text;

  // 座標リストに追加
  const li = document.createElement("li");
  li.textContent = `緯度: ${lat}, 経度: ${lon}`;
  list.appendChild(li);

  // 新しい座標をセッションデータに追加
  const newCoordinate = { lat, lon };
  jsonDate.coordinates.push(newCoordinate);

  // マーカーの更新（既存であれば移動、なければ新規作成）
  if (marker) {
    marker.setLatLng([lat, lon]);
  } else {
    marker = L.marker([lat, lon]).addTo(map);
  }

  // 現在地に地図を移動
  map.setView([lat, lon], map.getZoom());
}

// 「.save」ボタンで新しいセッションデータをmapping.jsonの配列に追加
const saveBtn = document.querySelector(".save");
saveBtn.addEventListener("click", function () {
  // ※ 保存用の処理はファイルが静的なため、通常はサーバー側への送信やローカルストレージに保存する方法になる
  // ここではあくまでロジックとして、fetchで取得後に push したデータを作成する例を示します

  // JSON.stringifyはここでは不要。jsonDateは既にオブジェクトです。

  fetch("./mapping.json")
    .then((response) => response.json())
    .then((mapping) => {
      if (!Array.isArray(mapping)) {
        console.error("mapping.jsonは配列形式である必要があります。");
        return;
      }
      // 配列に新しいセッションデータ（jsonDate）を追加
      mapping.push(jsonDate);

      // 追加後のデータを文字列に変換して確認（サーバーに保存する場合はここでPOST/PUTリクエストを行う）
      const updatedMappingJson = JSON.stringify(mapping, null, 2);
      console.log("更新後のmapping.json:", updatedMappingJson);

      // 例：更新内容をダウンロードリンク経由で保存する処理（静的サイト向け）
      const blob = new Blob([updatedMappingJson], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mapping.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // ※ サーバーに保存する場合は、別途API等を用意してください。
    })
    .catch((error) => console.error("Error fetching JSON:", error));
});
