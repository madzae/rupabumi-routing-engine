var EARTH_RADIUS_KM = 63710088e-1,
    UNITS_TO_KM = {
      centimeters: EARTH_RADIUS_KM * 100,
      centimetres: EARTH_RADIUS_KM * 100,
      degrees: 360 / (2 * Math.PI),
      feet: EARTH_RADIUS_KM * 3.28084,
      inches: EARTH_RADIUS_KM * 39.37,
      kilometers: EARTH_RADIUS_KM / 1e3,
      kilometres: EARTH_RADIUS_KM / 1e3,
      meters: EARTH_RADIUS_KM,
      metres: EARTH_RADIUS_KM,
      miles: EARTH_RADIUS_KM / 1609.344,
      millimeters: EARTH_RADIUS_KM * 1e3,
      millimetres: EARTH_RADIUS_KM * 1e3,
      nauticalmiles: EARTH_RADIUS_KM / 1852,
      radians: 1,
      yards: EARTH_RADIUS_KM * 1.0936,
  };

function createFeature(geometry, properties, options) {
  options = options || {};
  let feature = { type: "Feature" };
  (options.id === 0 || options.id) && (feature.id = options.id);
  options.bbox && (feature.bbox = options.bbox);
  feature.properties = properties || {};
  feature.geometry = geometry;
  return feature;
}

function createPoint(coordinates, properties, options) {
  options = options || {};
  if (!coordinates) throw new Error("coordinates is required");
  if (!Array.isArray(coordinates)) throw new Error("coordinates must be an Array");
  if (coordinates.length < 2) throw new Error("coordinates must be at least 2 numbers long");
  if (!isValidNumber(coordinates[0]) || !isValidNumber(coordinates[1]))
    throw new Error("coordinates must contain numbers");
  return createFeature({ type: "Point", coordinates }, properties, options);
}

function createLineString(coordinates, properties, options) {
  options = options || {};
  if (coordinates.length < 2)
    throw new Error("coordinates must be an array of two or more positions");
  return createFeature({ type: "LineString", coordinates }, properties, options);
}

function createFeatureCollection(features, options) {
  options = options || {};
  let collection = { type: "FeatureCollection" };
  options.id && (collection.id = options.id);
  options.bbox && (collection.bbox = options.bbox);
  collection.features = features;
  return collection;
}

function convertRadiansToUnit(radians, unit) {
  unit = unit || "kilometers";
  let factor = UNITS_TO_KM[unit];
  if (!factor) throw new Error(unit + " units is invalid");
  return radians * factor;
}

function degreesToRadians(degrees) {
  return ((degrees % 360) * Math.PI) / 180;
}

function isValidNumber(value) {
  return !isNaN(value) && value !== null && !Array.isArray(value);
}

function contractGraph(vertices, sourceCoords, edgeData, options) {
  options = options || {};
  let state = {
    vertices: Object.keys(vertices).reduce((acc, key) => ((acc[key] = { ...vertices[key] }), acc), {}),
    coordinates: Object.keys(vertices).reduce((acc, key) => {
      acc[key] = {};
      for (let neighbor of Object.keys(vertices[key])) acc[key][neighbor] = [sourceCoords[key]];
      return acc;
    }, {}),
    edgeData:
      "edgeDataReducer" in options
        ? Object.keys(vertices).reduce(
            (acc, key) => (
              (acc[key] = Object.keys(vertices[key]).reduce(
                (inner, neighbor) => ((inner[neighbor] = edgeData[key][neighbor]), inner),
                {},
              )),
              acc
            ),
            {},
          )
        : {},
  };

  let { vertices: contractedVertices, coordinates: contractedCoords, edgeData: contractedEdgeData } = state;
  let hasEdgeData = "edgeDataReducer" in options && contractedEdgeData;
  let contractibleNodes = Object.keys(vertices).filter((key) => isContractible(vertices, key));

  for (let node of contractibleNodes) {
    let nodeEdges = contractedVertices[node];
    let neighbors = Object.keys(nodeEdges);
    if (neighbors.length !== 0) {
      for (let a of neighbors) for (let b of neighbors) a !== b && (bypassNode(node, a, b), bypassNode(node, b, a));
      for (let neighbor of neighbors) {
        if (!contractedVertices[neighbor]) throw new Error(`Missing neighbor vertex for ${neighbor}`);
        delete contractedVertices[neighbor][node];
        delete contractedCoords[neighbor][node];
      }
      delete contractedVertices[node];
      delete contractedCoords[node];
    }
  }

  return state;

  function bypassNode(removedNode, fromNode, toNode) {
    let removedEdges = contractedVertices[removedNode];
    let fromEdges = contractedVertices[fromNode];
    let weightToRemoved = fromEdges[removedNode];
    if (!fromEdges[toNode] && weightToRemoved) {
      fromEdges[toNode] = weightToRemoved + removedEdges[toNode];
      contractedCoords[fromNode][toNode] = [...contractedCoords[fromNode][removedNode], ...contractedCoords[removedNode][toNode]];
      let edgeFromNode = hasEdgeData ? contractedEdgeData[fromNode][removedNode] : undefined;
      let edgeToNode = hasEdgeData ? contractedEdgeData[removedNode][toNode] : undefined;
      hasEdgeData && edgeFromNode && edgeToNode && (contractedEdgeData[fromNode][toNode] = options.edgeDataReducer(edgeFromNode, edgeToNode));
    }
  }
}

function getEdgesFromVertex(startKey, compactedVertices, vertices, sourceCoords, edgeData, bidirectional, options) {
  options = options || {};
  let neighbors = compactedVertices[startKey];
  return Object.keys(neighbors).reduce(buildEdgeMap, {
    edges: {},
    incomingEdges: {},
    coordinates: {},
    incomingCoordinates: {},
    reducedEdges: {},
  });

  function buildEdgeMap(result, neighborKey) {
    let resolved = resolveCompactedEdge(startKey, neighborKey, compactedVertices, vertices, sourceCoords, edgeData, bidirectional, options);
    let forwardWeight = resolved.weight;
    let backwardWeight = resolved.reverseWeight;

    if (resolved.vertexKey !== startKey) {
      if (!result.edges[resolved.vertexKey] || result.edges[resolved.vertexKey] > forwardWeight) {
        result.edges[resolved.vertexKey] = forwardWeight;
        result.coordinates[resolved.vertexKey] = [sourceCoords[startKey]].concat(resolved.coordinates);
        result.reducedEdges[resolved.vertexKey] = resolved.reducedEdge;
      }
      if (bidirectional && !isNaN(backwardWeight) &&
        (!result.incomingEdges[resolved.vertexKey] || result.incomingEdges[resolved.vertexKey] > backwardWeight)) {
        result.incomingEdges[resolved.vertexKey] = backwardWeight;
        var reversePath = [sourceCoords[startKey]].concat(resolved.coordinates);
        reversePath.reverse();
        result.incomingCoordinates[resolved.vertexKey] = reversePath;
      }
    }
    return result;
  }
}

function resolveCompactedEdge(fromKey, toKey, compactedVertices, vertices, sourceCoords, edgeData, bidirectional, options) {
  options = options || {};
  let forwardWeight = compactedVertices[fromKey][toKey];
  let backwardWeight = compactedVertices[toKey][fromKey];
  let intermediateCoordsForward = [];
  let intermediateCoordsBackward = [];
  let accumulatedEdgeData = "edgeDataReducer" in options ? edgeData[toKey][fromKey] : undefined;

  while (!vertices[toKey]) {
    var nextEdges = compactedVertices[toKey];
    if (!nextEdges) break;
    var nextKey = Object.keys(nextEdges).filter(function (k) { return k !== fromKey; })[0];
    forwardWeight += nextEdges[nextKey];
    if (bidirectional) {
      backwardWeight += compactedVertices[nextKey]?.[toKey] || Infinity;
      if (intermediateCoordsBackward.indexOf(toKey) >= 0) {
        vertices[toKey] = compactedVertices[toKey];
        break;
      }
      intermediateCoordsBackward.push(toKey);
    }
    let nextEdgeData = edgeData[toKey] && edgeData[toKey][nextKey];
    "edgeDataReducer" in options && accumulatedEdgeData && nextEdgeData &&
      (accumulatedEdgeData = options.edgeDataReducer(accumulatedEdgeData, nextEdgeData));
    intermediateCoordsForward.push(sourceCoords[toKey]);
    fromKey = toKey;
    toKey = nextKey;
  }

  return {
    vertexKey: toKey,
    weight: forwardWeight,
    reverseWeight: backwardWeight,
    coordinates: intermediateCoordsForward,
    reducedEdge: accumulatedEdgeData,
  };
}

function isContractible(vertices, nodeKey) {
  let neighbors = vertices[nodeKey];
  let neighborKeys = Object.keys(neighbors);
  switch (neighborKeys.length) {
    case 1:
      return !vertices[neighborKeys[0]][nodeKey];
    case 2:
      return neighborKeys.every((k) => vertices[k][nodeKey]);
    default:
      return false;
  }
}

var MinHeap = class {
  constructor(data, compareFn) {
    data = data || [];
    compareFn = compareFn || defaultCompare;
    this.data = data;
    this.length = this.data.length;
    this.compare = compareFn;
    if (this.length > 0)
      for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
  }
  push(item) {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }
  pop() {
    if (this.length === 0) return;
    let top = this.data[0];
    let last = this.data.pop();
    this.length--;
    if (this.length > 0) {
      this.data[0] = last;
      this._down(0);
    }
    return top;
  }
  peek() {
    return this.data[0];
  }
  _up(index) {
    let { data, compare } = this;
    let item = data[index];
    while (index > 0) {
      let parentIndex = (index - 1) >> 1;
      let parent = data[parentIndex];
      if (compare(item, parent) >= 0) break;
      data[index] = parent;
      index = parentIndex;
    }
    data[index] = item;
  }
  _down(index) {
    let { data, compare } = this;
    let halfLength = this.length >> 1;
    let item = data[index];
    while (index < halfLength) {
      let leftChild = (index << 1) + 1;
      let best = data[leftChild];
      let rightChild = leftChild + 1;
      if (rightChild < this.length && compare(data[rightChild], best) < 0) {
        leftChild = rightChild;
        best = data[rightChild];
      }
      if (compare(best, item) >= 0) break;
      data[index] = best;
      index = leftChild;
    }
    data[index] = item;
  }
};

function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function dijkstra(graph, startKey, endKey) {
  let distances = { [startKey]: 0 };
  let initialEntry = [0, [startKey], startKey];
  let queue = new MinHeap([initialEntry], (a, b) => a[0] - b[0]);

  for (;;) {
    let current = queue.pop();
    if (!current) return;
    let [currentCost, currentPath, currentKey] = current;
    if (currentKey === endKey) return [currentCost, currentPath];
    let neighbors = graph[currentKey];
    Object.keys(neighbors).forEach(function (neighborKey) {
      let newCost = currentCost + neighbors[neighborKey];
      if (newCost < Infinity && (!(neighborKey in distances) || newCost < distances[neighborKey])) {
        distances[neighborKey] = newCost;
        let entry = [newCost, currentPath.concat([neighborKey]), neighborKey];
        queue.push(entry);
      }
    });
  }
}

function getCoord(coord) {
  if (!coord) throw new Error("coord is required");
  if (!Array.isArray(coord)) {
    if (coord.type === "Feature" && coord.geometry !== null && coord.geometry.type === "Point")
      return [...coord.geometry.coordinates];
    if (coord.type === "Point") return [...coord.coordinates];
  }
  if (Array.isArray(coord) && coord.length >= 2 && !Array.isArray(coord[0]) && !Array.isArray(coord[1]))
    return [...coord];
  throw new Error("coord must be GeoJSON Point or an Array of numbers");
}

function haversineDistance(pointA, pointB, options) {
  options = options || {};
  var coordA = getCoord(pointA),
    coordB = getCoord(pointB),
    deltaLat = degreesToRadians(coordB[1] - coordA[1]),
    deltaLng = degreesToRadians(coordB[0] - coordA[0]),
    latA = degreesToRadians(coordA[1]),
    latB = degreesToRadians(coordB[1]),
    sinHalfLat = Math.pow(Math.sin(deltaLat / 2), 2),
    sinHalfLng = Math.pow(Math.sin(deltaLng / 2), 2),
    haversine = sinHalfLat + sinHalfLng * Math.cos(latA) * Math.cos(latB);
  return convertRadiansToUnit(2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)), options.units);
}

function coordEach(geojson, callback, excludeWrapCoord) {
  if (geojson !== null)
    for (
      var i, ring, geomIndex, featureIndex,
        coordIndex = 0,
        multiIndex = 0,
        isCollection = geojson.type === "FeatureCollection",
        isFeature = geojson.type === "Feature",
        featureCount = isCollection ? geojson.features.length : 1,
        featIdx = 0;
      featIdx < featureCount;
      featIdx++
    ) {
      let geom = isCollection ? geojson.features[featIdx].geometry : isFeature ? geojson.geometry : geojson;
      let isGeomCollection = geom ? geom.type === "GeometryCollection" : false;
      let geomCount = isGeomCollection ? geom.geometries.length : 1;

      for (var geomIdx = 0; geomIdx < geomCount; geomIdx++) {
        var ringIdx = 0, coordInGeomIdx = 0;
        let currentGeom = isGeomCollection ? geom.geometries[geomIdx] : geom;
        if (currentGeom !== null) {
          let coords = currentGeom.coordinates;
          let geomType = currentGeom.type;
          let wrapOffset = excludeWrapCoord && (geomType === "Polygon" || geomType === "MultiPolygon") ? 1 : 0;
          switch (geomType) {
            case null: break;
            case "Point":
              if (callback(coords, coordIndex, featIdx, ringIdx, coordInGeomIdx) === false) return false;
              coordIndex++; ringIdx++; break;
            case "LineString":
            case "MultiPoint":
              for (i = 0; i < coords.length; i++) {
                if (callback(coords[i], coordIndex, featIdx, ringIdx, coordInGeomIdx) === false) return false;
                coordIndex++;
                geomType === "MultiPoint" && ringIdx++;
              }
              geomType === "LineString" && ringIdx++;
              break;
            case "Polygon":
            case "MultiLineString":
              for (i = 0; i < coords.length; i++) {
                for (ring = 0; ring < coords[i].length - wrapOffset; ring++) {
                  if (callback(coords[i][ring], coordIndex, featIdx, ringIdx, coordInGeomIdx) === false) return false;
                  coordIndex++;
                }
                geomType === "MultiLineString" && ringIdx++;
                geomType === "Polygon" && coordInGeomIdx++;
              }
              geomType === "Polygon" && ringIdx++;
              break;
            case "MultiPolygon":
              for (i = 0; i < coords.length; i++) {
                for (coordInGeomIdx = 0, ring = 0; ring < coords[i].length; ring++) {
                  for (geomIndex = 0; geomIndex < coords[i][ring].length - wrapOffset; geomIndex++) {
                    if (callback(coords[i][ring][geomIndex], coordIndex, featIdx, ringIdx, coordInGeomIdx) === false) return false;
                    coordIndex++;
                  }
                  coordInGeomIdx++;
                }
                ringIdx++;
              }
              break;
            case "GeometryCollection":
              for (i = 0; i < currentGeom.geometries.length; i++)
                if (coordEach(currentGeom.geometries[i], callback, excludeWrapCoord) === false) return false;
              break;
            default:
              throw new Error("Unknown Geometry Type");
          }
        }
      }
    }
}

function featureEach(geojson, callback) {
  if (geojson.type === "Feature") callback(geojson, 0);
  else if (geojson.type === "FeatureCollection")
    for (var i = 0; i < geojson.features.length && callback(geojson.features[i], i) !== false; i++);
}

function explodeToPoints(geojson) {
  let points = [];
  if (geojson.type === "FeatureCollection")
    featureEach(geojson, function (feature) {
      coordEach(feature, function (coord) { points.push(createPoint(coord, feature.properties)); });
    });
  else if (geojson.type === "Feature")
    coordEach(geojson, function (coord) { points.push(createPoint(coord, geojson.properties)); });
  else
    coordEach(geojson, function (coord) { points.push(createPoint(coord)); });
  return createFeatureCollection(points);
}

function snapToGrid(coord, precision) {
  return [Math.round(coord[0] / precision) * precision, Math.round(coord[1] / precision) * precision];
}

function buildTopology(geojson, options) {
  options = options || {};
  let { key: keyFn = coordToKey } = options;
  let { tolerance = 1e-5 } = options;
  let lineFeatures = createFeatureCollection(geojson.features.filter((f) => f.geometry.type === "LineString"));
  let vertices = explodeToPoints(lineFeatures).features.reduce(function (acc, pointFeature, idx, all) {
    let snapped = snapToGrid(pointFeature.geometry.coordinates, tolerance);
    acc[keyFn(snapped)] = pointFeature.geometry.coordinates;
    idx % 1e3 === 0 && options.progress && options.progress("topo:vertices", idx, all.length);
    return acc;
  }, {});
  let edges = reduceFeatures(lineFeatures, buildEdgesFromLine, []);
  return { vertices, edges };

  function buildEdgesFromLine(acc, feature) {
    feature.geometry.coordinates.forEach(function (coord, idx, coords) {
      if (idx > 0) {
        let fromKey = keyFn(snapToGrid(coords[idx - 1], tolerance));
        let toKey = keyFn(snapToGrid(coord, tolerance));
        acc.push([fromKey, toKey, feature.properties]);
      }
    });
    return acc;
  }
}

function reduceFeatures(geojson, reducerFn, initialValue) {
  return geojson.type === "FeatureCollection"
    ? geojson.features.reduce(function (acc, feature) { return reduceFeatures(feature, reducerFn, acc); }, initialValue)
    : reducerFn(initialValue, geojson);
}

function coordToKey(coord) {
  return coord.join(",");
}

function buildGraph(geojson, options) {
  options = options || {};
  let topology = buildTopology(geojson, options);
  let { weight: weightFn = euclideanWeight } = options;
  let graphData = topology.edges.reduce(buildAdjacency, { edgeData: {}, vertices: {} });
  let { vertices: compactedVertices, coordinates: compactedCoords, edgeData: compactedEdgeData } = contractGraph(
    graphData.vertices, topology.vertices, graphData.edgeData, options
  );
  return {
    vertices: graphData.vertices,
    edgeData: graphData.edgeData,
    sourceCoordinates: topology.vertices,
    compactedVertices,
    compactedCoordinates: compactedCoords,
    compactedEdges: compactedEdgeData,
  };

  function buildAdjacency(acc, edge, idx, all) {
    let [fromKey, toKey, props] = edge;
    let weight = weightFn(
      topology.vertices[fromKey],
      topology.vertices[toKey],
      props
    );

    if (weight === Infinity) {
      return acc;
    }

    if (weight) {
      ensureVertex(fromKey);
      ensureVertex(toKey);
      if (weight instanceof Object) {
        setEdge(fromKey, toKey, weight.forward || Infinity);
        setEdge(toKey, fromKey, weight.backward || Infinity);
      } else {
        setEdge(fromKey, toKey, weight || Infinity);
        setEdge(toKey, fromKey, weight || Infinity);
      }
    }
    idx % 1e3 === 0 && options.progress && options.progress("edgeweights", idx, all.length);
    return acc;

    function ensureVertex(key) {
      acc.vertices[key] || ((acc.vertices[key] = {}), (acc.edgeData[key] = {}));
    }
    function setEdge(from, to, cost) {
      acc.vertices[from][to] = cost;
      acc.edgeData[from][to] = "edgeDataReducer" in options ? options.edgeDataSeed(props) : undefined;
    }
  }
}

function euclideanWeight(coordA, coordB) {
  return haversineDistance(createPoint(coordA), createPoint(coordB));
}

var HIGHWAY_COST = {

  motorway: 0.7,
  trunk: 0.8,

  primary: 1.0,

  secondary: 1.2,

  tertiary: 1.4,

  residential: 2.2,

  service: 3.5,

  unclassified: 2.8,

  living_street: 4.0,

  track: 5.0

};

var HARD_AVOID_ROADS = new Set([
  'Jalan Babakan'
]);

var START_ROAD_NAME = null;
var END_ROAD_NAME = null;

function findNearestRoadName(coord, geojson) {

  var bestRoad = null;
  var bestDist = Infinity;

  for (var i = 0; i < geojson.features.length; i++) {

    var feature = geojson.features[i];

    if (
      !feature.properties ||
      !feature.properties.name
    ) continue;

    var coords = feature.geometry.coordinates;

    for (var j = 0; j < coords.length; j++) {

      var p = coords[j];

      var dx = p[0] - coord[0];
      var dy = p[1] - coord[1];

      var d = dx * dx + dy * dy;

      if (d < bestDist) {
        bestDist = d;
        bestRoad = feature.properties.name;
      }
    }
  }

  return bestRoad;
}

function makeAvoidWeight(avoidedRules) {
  return function(coordA, coordB, props) {
    if (props) {
      if (
        props.name &&
        HARD_AVOID_ROADS.has(props.name)
      ) {

        var isStartRoad =
          props.name === START_ROAD_NAME;

        var isEndRoad =
          props.name === END_ROAD_NAME;

        if (
          !isStartRoad &&
          !isEndRoad
        ) {
          return Infinity;
        }
      }
      for (var rule of avoidedRules) {
        if (props.name && props.name === rule) {
          return Infinity;
        }
        if (rule.includes('=')) {
          var parts = rule.split('=');
          var key = parts[0].trim();
          var value = parts[1].trim();
          if (
            props[key] != null &&
            String(props[key]) === value
          ) {
            return Infinity;
          }
        }
        if (props.highway && props.highway === rule) {
          return Infinity;
        }
        if (props.surface && props.surface === rule) {
          return Infinity;
        }
        if (props.access && props.access === rule) {
          return Infinity;
        }
        if (props.toll && props.toll === rule) {
          return Infinity;
        }
        if (props.bridge && props.bridge === rule) {
          return Infinity;
        }
      }
    }

    var dist = haversineDistance(
      createPoint(coordA),
      createPoint(coordB)
    );

    var factor = 1;

    if (
      props &&
      props.highway &&
      HIGHWAY_COST[props.highway] != null
    ) {
      factor = HIGHWAY_COST[props.highway];
    }

    if (
      props &&
      props.surface === 'gravel'
    ) {
      factor *= 3;
    }

    if (
      props &&
      props.toll === 'yes'
    ) {
      factor *= 1.5;
    }

    return dist * factor;
  };
}

var PathFinder = class {
  constructor(geojson, options) {
    options = options || {};
    this.graph = buildGraph(geojson, options);
    this.options = options;
  }

  findPath(startPoint, endPoint) {
    let { key: keyFn = coordToKey, tolerance = 1e-5 } = this.options;
    let startKey = keyFn(snapToGrid(startPoint.geometry.coordinates, tolerance));
    let endKey = keyFn(snapToGrid(endPoint.geometry.coordinates, tolerance));
    if (!this.graph.vertices[startKey] || !this.graph.vertices[endKey]) return;

    let phantomStart = this._createPhantom(startKey);
    let phantomEnd = this._createPhantom(endKey);

    try {
      let result = dijkstra(this.graph.compactedVertices, startKey, endKey);
      if (result) {
        let [totalWeight, nodePath] = result;
        return {
          path: nodePath
            .reduce((coords, node, idx, path) => {
              idx > 0 && (coords = coords.concat(this.graph.compactedCoordinates[path[idx - 1]][node]));
              return coords;
            }, [])
            .concat([this.graph.sourceCoordinates[endKey]]),
          weight: totalWeight,
          edgeDatas:
            "edgeDataReducer" in this.options
              ? nodePath.reduce((acc, node, idx, path) => {
                  idx > 0 && acc.push(this.graph.compactedEdges[path[idx - 1]][node]);
                  return acc;
                }, [])
              : undefined,
        };
      } else return;
    } finally {
      this._removePhantom(phantomStart);
      this._removePhantom(phantomEnd);
    }
  }

  _createPhantom(nodeKey) {
    if (this.graph.compactedVertices[nodeKey]) return;
    let phantom = getEdgesFromVertex(
      nodeKey,
      this.graph.vertices,
      this.graph.compactedVertices,
      this.graph.sourceCoordinates,
      this.graph.edgeData,
      true,
      this.options,
    );
    this.graph.compactedVertices[nodeKey] = phantom.edges;
    this.graph.compactedCoordinates[nodeKey] = phantom.coordinates;
    "edgeDataReducer" in this.options && (this.graph.compactedEdges[nodeKey] = phantom.reducedEdges);
    Object.keys(phantom.incomingEdges).forEach((neighborKey) => {
      this.graph.compactedVertices[neighborKey][nodeKey] = phantom.incomingEdges[neighborKey];
      this.graph.compactedCoordinates[neighborKey] || (this.graph.compactedCoordinates[neighborKey] = {});
      this.graph.compactedCoordinates[neighborKey][nodeKey] = [
        this.graph.sourceCoordinates[neighborKey],
        ...phantom.incomingCoordinates[neighborKey].slice(0, -1),
      ];
      this.graph.compactedEdges && (
        this.graph.compactedEdges[neighborKey] || (this.graph.compactedEdges[neighborKey] = {}),
        this.graph.compactedEdges[neighborKey][nodeKey] = phantom.reducedEdges[neighborKey]
      );
    });
    return nodeKey;
  }

  _removePhantom(nodeKey) {
    if (!nodeKey) return;
    Object.keys(this.graph.compactedVertices[nodeKey]).forEach((neighborKey) => {
      delete this.graph.compactedVertices[neighborKey][nodeKey];
    });
    Object.keys(this.graph.compactedCoordinates[nodeKey]).forEach((neighborKey) => {
      delete this.graph.compactedCoordinates[neighborKey][nodeKey];
    });
    "edgeDataReducer" in this.options &&
      Object.keys(this.graph.compactedEdges[nodeKey]).forEach((neighborKey) => {
        delete this.graph.compactedEdges[neighborKey][nodeKey];
      });
    delete this.graph.compactedVertices[nodeKey];
    delete this.graph.compactedCoordinates[nodeKey];
    this.graph.compactedEdges && delete this.graph.compactedEdges[nodeKey];
  }
};

function pathToGeoJSON(pathResult) {
  if (pathResult) {
    let { weight, edgeDatas } = pathResult;
    return createLineString(pathResult.path, { weight, edgeDatas });
  }
}

window.PathFinder = PathFinder;
window.pathToGeoJSON = pathToGeoJSON;
window.makeAvoidWeight = makeAvoidWeight;
