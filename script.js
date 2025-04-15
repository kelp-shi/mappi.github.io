// タグに描画領域を設定する
const map = L.map('map_leaflet', {
    center: [35.658584, 139.7454316], // 東京タワーの緯度経度
    zoom: 17,
});

// 描画領域にOpenStreetMapを読み込む
const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
});
tileLayer.addTo(map);

var num = 0;
var watch_id;
var marker; // 現在地マーカー用変数

testBtn = document.querySelector('.test');
clearBtn = document.querySelector('.clear');
var list = document.querySelector('ul'); // `<ul>` を取得

testBtn.addEventListener('click', function() {
    watch_id = navigator.geolocation.watchPosition(test2, function(e) { alert(e.message); }, {
        "enableHighAccuracy": true,
        "timeout": 20000,
        "maximumAge": 2000
    });
});

clearBtn.addEventListener('click', function() {
    navigator.geolocation.clearWatch(watch_id);
    if (marker) map.removeLayer(marker); // 既存のマーカーを削除
});

function test2(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    var geo_text = `緯度: ${lat}\n経度: ${lon}\n高度: ${position.coords.altitude}\n`;
    geo_text += `位置精度: ${position.coords.accuracy}\n高度精度: ${position.coords.altitudeAccuracy}\n`;
    geo_text += `移動方向: ${position.coords.heading}\n速度: ${position.coords.speed}\n`;

    var date = new Date(position.timestamp);
    geo_text += `取得時刻: ${date.toLocaleString()}\n取得回数: ${++num}\n`;

    document.getElementById('position_view').innerHTML = geo_text;

    // `ul` に新しい `li` を追加
    var li = document.createElement('li');
    li.textContent = `緯度: ${lat}, 経度: ${lon}`;
    list.appendChild(li);

    // 地図に現在地のマーカーを追加（更新）
    if (marker) {
        marker.setLatLng([lat, lon]); // 既存マーカーを移動
    } else {
        marker = L.marker([lat, lon]).addTo(map); // 初回のみマーカーを作成
    }

    map.setView([lat, lon], map.getZoom()); // 地図の表示位置を現在地に移動
}