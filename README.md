# rupabumi-routing-engine
Rupabumi City-Scale Routing Engine

Rupabumi City-Scale Routing Engine

Rupabumi City-Scale Routing Engine is a city-scale routing engine built with vanilla JavaScript.

The routing graph is generated from OpenStreetMap data using Osmium tools and converted into a graph structure optimized for route calculation.

Building the Graph

1. Extract the target city

osmium extract --bbox 116.04,-8.66,116.18,-8.52 indonesia.osm.pbf -o mataram.osm.pbf

Example above extracts the Mataram area from the Indonesia OSM PBF.

2. Keep road data only

osmium tags-filter mataram.osm.pbf w/highway -o mataram_roads.osm.pbf

3. Export to GeoJSON Sequence

osmium export mataram_roads.osm.pbf -f geojsonseq -o mataram.geojsonseq

4. Convert GeoJSON Sequence to GeoJSON

import json
features = []
with open("jakarta.geojsonseq", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            features.append(json.loads(line))
geojson = {
    "type": "FeatureCollection",
    "features": features
}
with open("jakarta.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson, f)
print("done")

5. Build the routing graph

The GeoJSON file is processed into a graph consisting of nodes and edges. Intersections become graph nodes, while road segments become edges with associated weights.

Routing

The engine uses the Dijkstra shortest-path algorithm with custom weighting.

Instead of using pure distance, road classifications are also considered. Major roads such as motorway, trunk, primary, and secondary roads receive lower penalties than residential or service roads. This makes the generated route prefer main roads whenever reasonable, producing more realistic results for city navigation.

Features

* Vanilla JavaScript
* OpenStreetMap-based routing
* City-scale graph generation
* Dijkstra shortest-path algorithm
* Custom road-class weighting
* No external routing engine dependencies
* Fast route calculation for urban areas
