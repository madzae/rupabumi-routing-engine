# Rupabumi City-Scale Routing Engine

## Demo

https://labs.rupabumi.com/routing/

##

Rupabumi City-Scale Routing Engine is a lightweight city-scale routing engine built with vanilla JavaScript.

The routing graph is generated from OpenStreetMap data and uses a modified Dijkstra algorithm with custom road weighting. Major roads are preferred over residential and service roads, resulting in more realistic routes for urban navigation.

## Graph Generation

### 1. Extract city data from OSM PBF

```bash
osmium extract --bbox 116.04,-8.66,116.18,-8.52 indonesia.osm.pbf -o mataram.osm.pbf
```

Example above extracts the Mataram area.

### 2. Keep only road data

```bash
osmium tags-filter mataram.osm.pbf w/highway -o mataram_roads.osm.pbf
```

### 3. Export to GeoJSON Sequence

```bash
osmium export mataram_roads.osm.pbf -f geojsonseq -o mataram.geojsonseq
```

### 4. Convert GeoJSON Sequence to GeoJSON

```python
import json

features = []

with open("mataram.geojsonseq", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            features.append(json.loads(line))

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open("mataram.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson, f)

print("done")
```

## Routing Algorithm

The engine uses the Dijkstra shortest-path algorithm.

Edge weights are modified based on OpenStreetMap road classifications. Main roads receive lower penalties, while residential and service roads receive higher penalties. This allows the routing engine to prefer major roads instead of simply selecting the shortest geometric distance.

Example weighting strategy:

| Highway Type | Priority |
|--------------|----------|
| motorway | Highest |
| trunk | High |
| primary | High |
| secondary | Medium |
| tertiary | Medium |
| residential | Low |
| service | Lowest |

## Workflow

```text
OpenStreetMap PBF
        ↓
   Osmium Extract
        ↓
   Highway Filter
        ↓
 GeoJSON Sequence
        ↓
 GeoJSON Conversion
        ↓
   Graph Builder
        ↓
 Modified Dijkstra
        ↓
      Route
```

## Features

- Vanilla JavaScript implementation
- OpenStreetMap-based routing
- City-scale graph generation
- Modified Dijkstra algorithm
- Road-class-aware weighting
- No external routing engine dependencies
- Fast route calculation for urban areas
