<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Rupabumi Routing Engine</title>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

<style>
html, body, #map {
    margin: 0;
    width: 100%;
    height: 100%;
    font-family: sans-serif;
}

#panel {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: white;
    padding: 10px 12px;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 320px;
}

.input-wrap {
    position: relative;
}

.input-wrap label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #555;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.input-wrap input {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
}

.input-wrap input:focus {
    border-color: #4a90d9;
}

.suggestions {
    position: fixed;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    max-height: 200px;
    overflow-y: auto;
    display: none;
    min-width: 280px;
}

.suggestions div {
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    line-height: 1.4;
}

.suggestions div:last-child {
    border-bottom: none;
}

.suggestions div:hover {
    background: #f0f6ff;
}

.suggestions div .sub {
    font-size: 11px;
    color: #888;
}

.panel-btns {
    display: flex;
    gap: 6px;
}

button {
    padding: 8px 14px;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
}

#findBtn {
    background: #2563eb;
    color: white;
    flex: 1;
}

#findBtn:hover { background: #1d4ed8; }

#resetBtn {
    background: #f1f1f1;
    color: #333;
}

#resetBtn:hover { background: #e0e0e0; }

.avoid-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
}

.avoid-chip {
    position: relative;
    cursor: pointer;
}

.avoid-chip input {
    display: none;
}

.avoid-chip span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #f3f4f6;
    border: 1px solid #dcdfe4;
    font-size: 12px;
    font-weight: 500;
    color: #444;
    transition: all 0.15s ease;
    user-select: none;
}

.avoid-chip:hover span {
    background: #e8eefc;
    border-color: #b7caf5;
}

.avoid-chip input:checked + span {
    background: #2563eb;
    border-color: #2563eb;
    color: white;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
}
</style>
</head>
<body>

<div id="panel">
    <div class="input-wrap">
        <label>Starting Point</label>
        <input type="text" id="originInput" placeholder="Search place or paste lat,lon…" autocomplete="off"/>
        <div class="suggestions" id="originSuggestions"></div>
    </div>
    <div class="input-wrap">
        <label>Destination</label>
        <input type="text" id="destInput" placeholder="Search place or paste lat,lon…" autocomplete="off"/>
        <div class="suggestions" id="destSuggestions"></div>
    </div>
    <div class="input-wrap">
        <label>Avoid Roads (comma separated)</label>
        <input type="text" id="avoidInput"
               placeholder="Example: Jalan Majapahit, primary"/>
    </div>
    <div class="avoid-options">

        <label class="avoid-chip">
            <input type="checkbox" value="highway=primary" class="avoidToggle">
            <span>Primary</span>
        </label>

        <label class="avoid-chip">
            <input type="checkbox" value="surface=gravel" class="avoidToggle">
            <span>Gravel</span>
        </label>

        <label class="avoid-chip">
            <input type="checkbox" value="toll=yes" class="avoidToggle">
            <span>Toll</span>
        </label>

        <label class="avoid-chip">
            <input type="checkbox" value="highway=residential" class="avoidToggle">
            <span>Residential</span>
        </label>

    </div>
    <div class="panel-btns">
        <button id="findBtn">Find Route</button>
        <button id="resetBtn">Reset</button>
    </div>
</div>

<div id="routeList" style="position:absolute;top:10px;right:20px;z-index:1000;background:white;padding:10px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);max-height:300px;overflow-y:auto;display:none;min-width:200px;font-size:13px;"></div>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="./path-v7.js?v=3"></script>

<script>

const DB_NAME = 'routing-db';
const STORE_NAME = 'files';
const GEOJSON_KEY = 'mataram-geojson';

var geojson;
var pathFinder;
var vertices = [];

var start = null;
var end = null;

var startMarker = null;
var endMarker = null;
var routeLayer = null;

var avoidedRoads = new Set();

var map = L.map('map').setView([-8.58, 116.11], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.5
}).addTo(map);

var acTimers = {};

function positionSuggestions(input, suggBox) {
    var rect = input.getBoundingClientRect();
    suggBox.style.top  = (rect.bottom + window.scrollY + 2) + 'px';
    suggBox.style.left = (rect.left  + window.scrollX)     + 'px';
    suggBox.style.width = rect.width + 'px';
}

function setupAutocomplete(inputId, suggId, onSelect) {
    var input = document.getElementById(inputId);
    var suggBox = document.getElementById(suggId);

    document.body.appendChild(suggBox);

    input.addEventListener('input', function() {
        var val = input.value.trim();

        if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val)) {
            suggBox.style.display = 'none';
            return;
        }

        clearTimeout(acTimers[inputId]);

        if (val.length < 2) {
            suggBox.style.display = 'none';
            return;
        }

        acTimers[inputId] = setTimeout(function() {
            fetch('poi.php?q=' + encodeURIComponent(val))
                .then(function(r) { return r.json(); })
                .then(function(results) {
                    suggBox.innerHTML = '';

                    if (!results || results.length === 0) {
                        suggBox.style.display = 'none';
                        return;
                    }

                    results.slice(0, 8).forEach(function(item) {
                        var div = document.createElement('div');
                        var name = item.name || item.display_name || '';
                        var sub  = item.type || item.category || '';
                        div.innerHTML = '<div>' + name + '</div>' +
                            (sub ? '<div class="sub">' + sub + '</div>' : '');
                        div.addEventListener('mousedown', function(e) {
                            e.preventDefault();
                            input.value = name;
                            suggBox.style.display = 'none';
                            onSelect(item);
                        });
                        suggBox.appendChild(div);
                    });

                    positionSuggestions(input, suggBox);
                    suggBox.style.display = 'block';
                })
                .catch(function() {
                    suggBox.style.display = 'none';
                });
        }, 250);
    });

    input.addEventListener('blur', function() {
        setTimeout(function() { suggBox.style.display = 'none'; }, 150);
    });

    input.addEventListener('focus', function() {
        if (suggBox.childElementCount > 0) {
            positionSuggestions(input, suggBox);
            suggBox.style.display = 'block';
        }
    });

    window.addEventListener('scroll', function() {
        if (suggBox.style.display === 'block') positionSuggestions(input, suggBox);
    }, true);
}

function parseLatLon(str) {
    var m = str.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    var lat = parseFloat(m[1]);
    var lng = parseFloat(m[2]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lng, lat];
}

function coordFromItem(item) {
    if (item.lat != null && item.lon != null) return [parseFloat(item.lon), parseFloat(item.lat)];
    if (item.latitude != null && item.longitude != null) return [parseFloat(item.longitude), parseFloat(item.latitude)];
    if (item.geometry && item.geometry.coordinates) return item.geometry.coordinates;
    return null;
}

setupAutocomplete('originInput', 'originSuggestions', function(item) {
    var coord = coordFromItem(item);
    if (coord) {
        start = nearest(coord);
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker([start[1], start[0]]).addTo(map).bindPopup('START').openPopup();
    }
});

setupAutocomplete('destInput', 'destSuggestions', function(item) {
    var coord = coordFromItem(item);
    if (coord) {
        end = nearest(coord);
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker([end[1], end[0]]).addTo(map).bindPopup('END').openPopup();
    }
});

function openDB() {
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        req.onsuccess = function() { resolve(req.result); };
        req.onerror  = function() { reject(req.error); };
    });
}

function getGeoJSON() {
    return openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(STORE_NAME, 'readonly');
            var req = tx.objectStore(STORE_NAME).get(GEOJSON_KEY);
            req.onsuccess = function() { resolve(req.result); };
            req.onerror  = function() { reject(req.error); };
        });
    });
}

function saveGeoJSON(data) {
    return openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(STORE_NAME, 'readwrite');
            var req = tx.objectStore(STORE_NAME).put(data, GEOJSON_KEY);
            req.onsuccess = function() { resolve(); };
            req.onerror  = function() { reject(req.error); };
        });
    });
}

function loadGeoJSON() {
    console.log('checking browser cache...');
    return getGeoJSON().then(function(data) {
        if (!data) {
            console.log('fetching from server...');
            return fetch('./mataram.geojson')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    return saveGeoJSON(data).then(function() { return data; });
                });
        }
        console.log('loaded from browser');
        return data;
    });
}

function nearest(coord) {
    var best = null, bestDist = Infinity;
    for (var i = 0; i < vertices.length; i++) {
        var v = vertices[i];
        var dx = v[0] - coord[0], dy = v[1] - coord[1];
        var d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; best = v; }
    }
    return best;
}

function rebuildPathFinder() {

    avoidedRoads.clear();
    var avoidText = document.getElementById('avoidInput').value.trim();

    if (avoidText) {
        avoidText.split(',').forEach(function(name) {
            name = name.trim();
            if (name) avoidedRoads.add(name);
        });
    }

    document.querySelectorAll('.avoidToggle').forEach(function(el) {
        if (el.checked) {
            avoidedRoads.add(el.value);
        }
    });

    console.log('avoiding:', Array.from(avoidedRoads));

    pathFinder = new PathFinder(geojson, {
        precision: 1e-5,
        weight: makeAvoidWeight(avoidedRoads)
    });
}


loadGeoJSON().then(function(data) {
    geojson = data;

    geojson.features = geojson.features.filter(function(f) {
        if (!f || !f.geometry || f.geometry.type !== 'LineString') return false;
        var c = f.geometry.coordinates;
        if (!Array.isArray(c) || c.length < 2) return false;
        for (var i = 0; i < c.length; i++) {
            var p = c[i];
            if (!Array.isArray(p) || p.length < 2) return false;
            if (typeof p[0] !== 'number' || typeof p[1] !== 'number') return false;
        }
        return true;
    });

    console.log('valid features:', geojson.features.length);

    L.geoJSON(geojson, { style: { color: '#777', weight: 1.5 } }).addTo(map);

    console.log('graph ready');

    for (var i = 0; i < geojson.features.length; i++) {
        var coords = geojson.features[i].geometry.coordinates;
        for (var j = 0; j < coords.length; j++) vertices.push(coords[j]);
    }

    console.log('vertices:', vertices.length);
});

function getRoadName(coord1, coord2) {
    for (var i = 0; i < geojson.features.length; i++) {
        var coords = geojson.features[i].geometry.coordinates;
        var props  = geojson.features[i].properties;
        for (var j = 0; j < coords.length - 1; j++) {
            var a = coords[j], b = coords[j + 1];
            if (
                (Math.abs(a[0]-coord1[0])<1e-5 && Math.abs(a[1]-coord1[1])<1e-5 &&
                 Math.abs(b[0]-coord2[0])<1e-5 && Math.abs(b[1]-coord2[1])<1e-5)
                ||
                (Math.abs(b[0]-coord1[0])<1e-5 && Math.abs(b[1]-coord1[1])<1e-5 &&
                 Math.abs(a[0]-coord2[0])<1e-5 && Math.abs(a[1]-coord2[1])<1e-5)
            ) return props.name || props.highway || '(unnamed)';
        }
    }
    return '(unknown)';
}

function getTurnDirection(p1, p2, p3) {
    var b1 = Math.atan2(p2[0]-p1[0], p2[1]-p1[1]) * 180 / Math.PI;
    var b2 = Math.atan2(p3[0]-p2[0], p3[1]-p2[1]) * 180 / Math.PI;
    var a  = b2 - b1;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    if (a > 20)  return 'Turn Right';
    if (a < -20) return 'Turn Left';
    return 'Straight';
}

document.getElementById('findBtn').addEventListener('click', function() {
    var originVal = document.getElementById('originInput').value.trim();
    var destVal   = document.getElementById('destInput').value.trim();

    var parsedOrigin = parseLatLon(originVal);
    var parsedDest   = parseLatLon(destVal);

    if (parsedOrigin) {
        start = nearest(parsedOrigin);
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker([start[1], start[0]]).addTo(map).bindPopup('START').openPopup();
    }

    if (parsedDest) {
        end = nearest(parsedDest);
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker([end[1], end[0]]).addTo(map).bindPopup('END').openPopup();
    }

    if (!start || !end) {
        alert('Set starting point and destination first');
        return;
    }

    START_ROAD_NAME = findNearestRoadName(start, geojson);
    END_ROAD_NAME = findNearestRoadName(end, geojson);

    console.log('START ROAD:', START_ROAD_NAME);
    console.log('END ROAD:', END_ROAD_NAME);

    console.log('routing...');

    rebuildPathFinder();

    var result = pathFinder.findPath(
        { type: 'Feature', geometry: { type: 'Point', coordinates: start } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: end   } }
    );

    console.log(result);

    if (!result) { alert('No route found'); return; }

    if (routeLayer) map.removeLayer(routeLayer);

    routeLayer = L.geoJSON({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: result.path }
    }, { style: { color: 'red', weight: 5 } }).addTo(map);

    map.fitBounds(routeLayer.getBounds());

    var list = document.getElementById('routeList');
    list.innerHTML = '<b>Path (' + result.path.length + ' points)</b><br><br>';

    var currentRoad = null;
    for (var i = 0; i < result.path.length - 1; i++) {
        var road = getRoadName(result.path[i], result.path[i + 1]);
        if (road !== currentRoad) {
            var turn = (i > 0) ? getTurnDirection(result.path[i-1], result.path[i], result.path[i+1]) : '';
            list.innerHTML += '<br><b>' + (turn ? '⟶ ' + turn + ' onto ' : '') + road + '</b><br>';
            currentRoad = road;
        }
        list.innerHTML += (i + 1) + '. ' + result.path[i][1].toFixed(6) + ', ' + result.path[i][0].toFixed(6) + '<br>';
    }
    list.innerHTML += result.path.length + '. ' + result.path[result.path.length-1][1].toFixed(6) + ', ' + result.path[result.path.length-1][0].toFixed(6) + '<br>';
    list.style.display = 'block';
});

document.getElementById('resetBtn').addEventListener('click', function() {
    start = null; end = null;
    document.getElementById('originInput').value = '';
    document.getElementById('destInput').value   = '';
    if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
    if (endMarker)   { map.removeLayer(endMarker);   endMarker   = null; }
    if (routeLayer)  { map.removeLayer(routeLayer);  routeLayer  = null; }
    var list = document.getElementById('routeList');
    list.innerHTML = '';
    list.style.display = 'none';
    console.log('reset');
});

</script>
</body>
</html>
