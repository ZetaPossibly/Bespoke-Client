// Fully asynchronous and non-blocking rendering pipeline
(function (global) {
  'use strict';

  if (typeof Cesium === 'undefined') {
    console.error('[GeoFSWaypointVisualizer] Cesium.js was not found on this page.');
    return;
  }

  const Util = {
    feetToMeters(ft) {
      return ft * 0.3048;
    },

    toNumber(value, fallback = null) {
      if (value === '' || value === null || typeof value === 'undefined') return fallback;
      const n = typeof value === 'number' ? value : parseFloat(value);
      return Number.isFinite(n) ? n : fallback;
    },

    isValidAltitude(alt) {
      const num = Util.toNumber(alt, null);
      return num !== null && num > 0;
    },

    toColor(input, alpha) {
      let c;
      if (input instanceof Cesium.Color) c = input;
      else if (typeof input === 'string') c = Cesium.Color.fromCssColorString(input);
      else c = Cesium.Color.WHITE;
      return typeof alpha === 'number' ? c.withAlpha(alpha) : c;
    },

    cleanIdent(ident) {
      if (!ident) return '';
      return String(ident).split('|')[0].trim();
    },

    headingToScreenRotation(headingDeg) {
      const h = Util.toNumber(headingDeg, 0);
      return Cesium.Math.toRadians(360 - h);
    }
  };

  // Small canvas-drawn triangular arrow for heading billboards
  function buildArrowCanvas(cssColor) {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.translate(size / 2, size / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size / 2 + 2);
    ctx.lineTo(size / 3, size / 2 - 4);
    ctx.lineTo(0, size / 3 - 4);
    ctx.lineTo(-size / 3, size / 2 - 4);
    ctx.closePath();
    ctx.fillStyle = cssColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return canvas;
  }

  const DEFAULT_TYPE_STYLES = {
    DPT:       { color: '#ff4444', pointSize: 12, labelPrefix: 'DEP  ' },
    WPT:       { color: '#ffcc00', pointSize: 12, labelPrefix: 'ARR  ' },
    NDB:       { color: '#4da6ff', pointSize: 10, labelPrefix: 'NDB  ' },
    'VOR-DME': { color: '#33cc99', pointSize: 10, labelPrefix: 'VOR  ' },
    FIX:       { color: '#cccccc', pointSize: 6,  labelPrefix: '' },
    DEFAULT:   { color: '#ffffff', pointSize: 8,  labelPrefix: '' }
  };

  const DEFAULT_OPTIONS = {
    showPoints: true,
    showLabels: true,
    showPath: true,
    showHeadingArrows: false,

    scaleByDistance: true,
    scaleByDistanceParams: [100, 2.0, 50000, 0.2], // [nearDistance(m), nearScale, farDistance(m), farScale]

    altitudeUnits: 'm',            // 'ft' or 'm'
    heightReference: 'absolute',    // 'absolute' | 'relative' | 'clamp'
    defaultAltitudeFt: 1000,        // fallback if terrain alt sampling fails
    terrainOffsetMeters: 10,        // height above ground level when unknown waypoint alt

    pointOutlineColor: '#000000',
    pointOutlineWidth: 1,
    pointVisibilityDistance: null,  // meters, null = always visible

    labelFont: '14px Times New Roman serif',
    labelFillColor: '#ffffff',
    labelOutlineColor: '#000000',
    labelOutlineWidth: 3,
    labelStyle: 'FILL',
    lablelHorizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    labelPixelOffset: [0, -25], 
    labelShowBackground: true,
    labelBackgroundColor: 'rgb(0, 0, 0)',
    labelVisibilityDistance: null,
    labelFormatter: null,

    pathColor: '#000000',
    pathWidth: 3,
    pathAlpha: 0.8,
    pathStyle: 'solid',             // 'solid' | 'dashed'
    pathColorMode: 'byType',         // 'solid' | 'byType'
    pathClampToGround: false,

    activeIndex: null,
    activeStyle: { color: '#ff00ff', pointSize: 16, outlineColor: '#ffffff' },

    // --- per-type styling ---
    typeStyles: {},

    // --- filtering ---
    filter: null,

    // --- interaction ---
    onWaypointClick: null,
    onWaypointHover: null,

    // --- description popup ---
    descriptionFormatter: null
  };

  let instanceCounter = 0;

  class GeoFSWaypointVisualizer {
    constructor(viewer, options = {}) {
      if (!viewer) throw new Error('[GeoFSWaypointVisualizer] A Cesium viewer instance is required.');

      this.viewer = viewer;
      this.options = GeoFSWaypointVisualizer.mergeOptions(DEFAULT_OPTIONS, options);

      this._id = 'geofs-waypoints-' + (++instanceCounter);
      this._dataSource = new Cesium.CustomDataSource(this._id);
      this.viewer.dataSources.add(this._dataSource);

      this._waypoints = [];
      this._syncTimer = null;
      this._eventHandler = null;
      this._arrowCanvasCache = new Map();
      this._renderToken = 0; // Token to cancel superseded async renders

      this._setupPicking();
    }

    // static helpers
    static mergeOptions(base, override) {
      const merged = { ...base, ...override };
      merged.typeStyles = { ...(base.typeStyles || {}), ...(override.typeStyles || {}) };
      merged.activeStyle = { ...(base.activeStyle || {}), ...(override.activeStyle || {}) };
      return merged;
    }

    static getFlightPlanWaypoints() {
      if (typeof geofs === 'undefined' || !geofs.flightPlan || !geofs.flightPlan.waypointArray) return [];
      return geofs.flightPlan.waypointArray.map(w => ({
        ident: w.ident, type: w.type, lat: w.lat, lon: w.lon,
        alt: w.alt, spd: w.spd, track: w.track
      }));
    }

    static waitForViewer(callback, intervalMs = 500) {
      let cancelled = false;
      const check = () => {
        if (cancelled) return;
        if (typeof geofs !== 'undefined' && geofs.api && geofs.api.viewer) {
          callback(geofs.api.viewer);
        } else {
          setTimeout(check, intervalMs);
        }
      };
      check();
      return () => { cancelled = true; };
    }

    static fromGeoFS(options = {}) {
      return new Promise((resolve) => {
        GeoFSWaypointVisualizer.waitForViewer((viewer) => {
          const viz = new GeoFSWaypointVisualizer(viewer, options);
          viz.setWaypoints(GeoFSWaypointVisualizer.getFlightPlanWaypoints());
          resolve(viz);
        });
      });
    }

    // config and data
    configure(partialOptions = {}) {
      this.options = GeoFSWaypointVisualizer.mergeOptions(this.options, partialOptions);
      this._render();
      return this;
    }

    getOptions() {
      return { ...this.options };
    }

    resetOptions() {
      this.options = GeoFSWaypointVisualizer.mergeOptions(DEFAULT_OPTIONS, {});
      this._render();
      return this;
    }

    setWaypoints(waypoints = []) {
      this._waypoints = Array.isArray(waypoints) ? waypoints.slice() : [];
      this._render();
      return this;
    }

    getWaypoints() {
      return this._waypoints.slice();
    }

    addWaypoint(waypoint, index = this._waypoints.length) {
      this._waypoints.splice(index, 0, waypoint);
      this._render();
      return this;
    }

    removeWaypoint(identOrIndex) {
      const idx = typeof identOrIndex === 'number'
        ? identOrIndex
        : this._waypoints.findIndex(w => w.ident === identOrIndex);
      if (idx >= 0) this._waypoints.splice(idx, 1);
      this._render();
      return this;
    }

    setActiveWaypoint(identOrIndex) {
      if (identOrIndex === null) {
        this.options.activeIndex = null;
      } else {
        const idx = typeof identOrIndex === 'number'
          ? identOrIndex
          : this._waypoints.findIndex(w => w.ident === identOrIndex);
        this.options.activeIndex = idx >= 0 ? idx : null;
      }
      this._render();
      return this;
    }

    show() { this._dataSource.show = true; return this; }
    hide() { this._dataSource.show = false; return this; }
    setVisible(visible) { this._dataSource.show = !!visible; return this; }

    zoomTo(durationSeconds = 1.5) {
      return this.viewer.flyTo(this._dataSource, { duration: durationSeconds });
    }

    startAutoSync({ intervalMs = 2000, getWaypoints = GeoFSWaypointVisualizer.getFlightPlanWaypoints } = {}) {
      this.stopAutoSync();
      let lastSignature = null;
      this._syncTimer = setInterval(() => {
        const waypoints = getWaypoints();
        const signature = JSON.stringify(waypoints);
        if (signature !== lastSignature) {
          lastSignature = signature;
          this.setWaypoints(waypoints);
        }
      }, intervalMs);
      return this;
    }

    stopAutoSync() {
      if (this._syncTimer) {
        clearInterval(this._syncTimer);
        this._syncTimer = null;
      }
      return this;
    }

    clear() {
      this._dataSource.entities.removeAll();
      return this;
    }

    destroy() {
      this._renderToken++;
      this.stopAutoSync();
      if (this._eventHandler) {
        this._eventHandler.destroy();
        this._eventHandler = null;
      }
      this.viewer.dataSources.remove(this._dataSource, true);
    }

    // internal rendering
    _resolveTypeStyle(type) {
      const overrides = this.options.typeStyles;
      return {
        ...DEFAULT_TYPE_STYLES.DEFAULT,
        ...(DEFAULT_TYPE_STYLES[type] || {}),
        ...(overrides[type] || {})
      };
    }

    _resolveHeightReferenceEnum() {
      switch (this.options.heightReference) {
        case 'clamp': return Cesium.HeightReference.CLAMP_TO_GROUND;
        case 'relative': return Cesium.HeightReference.RELATIVE_TO_GROUND;
        default: return Cesium.HeightReference.NONE;
      }
    }

    _defaultLabelText(wp, index) {
      const style = this._resolveTypeStyle(wp.type);
      const ident = Util.cleanIdent(wp.ident) || `WP${index + 1}`;
      return `${style.labelPrefix}${ident}`;
    }

    _defaultDescription(wp) {
      const alt = Util.toNumber(wp.alt);
      const spd = Util.toNumber(wp.spd);
      const lat = Util.toNumber(wp.lat, 0);
      const lon = Util.toNumber(wp.lon, 0);
      return `
        <table>
          <tr><td><b>Ident</b></td><td>${Util.cleanIdent(wp.ident)}</td></tr>
          <tr><td><b>Type</b></td><td>${wp.type || ''}</td></tr>
          <tr><td><b>Lat</b></td><td>${lat.toFixed(5)}</td></tr>
          <tr><td><b>Lon</b></td><td>${lon.toFixed(5)}</td></tr>
          <tr><td><b>Alt</b></td><td>${alt !== null ? alt + ' ft' : '—'}</td></tr>
          <tr><td><b>Speed</b></td><td>${spd !== null ? spd + ' kt' : '—'}</td></tr>
          <tr><td><b>Track</b></td><td>${wp.track !== '' && wp.track != null ? wp.track + '°' : '—'}</td></tr>
        </table>`;
    }

    _getArrowCanvas(cssColor) {
      if (!this._arrowCanvasCache.has(cssColor)) {
        this._arrowCanvasCache.set(cssColor, buildArrowCanvas(cssColor));
      }
      return this._arrowCanvasCache.get(cssColor);
    }

    async _resolvePositionsAsync(indexed, token) {
      const positions = new Array(indexed.length);
      const missingIndices = [];
      const cartographicsToSample = [];

      indexed.forEach((item, i) => {
        const wp = item.wp;
        if (Util.isValidAltitude(wp.alt)) {
          const altFt = Util.toNumber(wp.alt);
          const heightMeters = this.options.altitudeUnits === 'ft' ? Util.feetToMeters(altFt) : altFt;
          const h = this.options.heightReference === 'clamp' ? 0 : heightMeters;
          positions[i] = Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, h);
        } else {
          missingIndices.push(i);
          cartographicsToSample.push(Cesium.Cartographic.fromDegrees(wp.lon, wp.lat));
        }
      });

      // Query terrain provider asynchronously for waypoints lacking altitude
      if (missingIndices.length > 0 && token === this._renderToken) {
        let terrainHeights = null;
        const terrainProvider = this.viewer.terrainProvider;

        if (terrainProvider && typeof Cesium.sampleTerrainMostDetailed === 'function') {
          try {
            const updated = await Cesium.sampleTerrainMostDetailed(terrainProvider, cartographicsToSample);
            terrainHeights = updated.map(c => c.height);
          } catch (err) {
            console.warn('[GeoFSWaypointVisualizer] Terrain sampling failed, using fallback height:', err);
          }
        }

        if (token !== this._renderToken) return positions;

        missingIndices.forEach((idx, mIdx) => {
          const wp = indexed[idx].wp;
          let groundHeight = 0;

          if (terrainHeights && typeof terrainHeights[mIdx] === 'number' && !isNaN(terrainHeights[mIdx])) {
            groundHeight = terrainHeights[mIdx];
          } else if (typeof geofs !== 'undefined' && typeof geofs.getGroundAltitude === 'function') {
            const geofsAlt = geofs.getGroundAltitude([wp.lat, wp.lon, 0]);
            groundHeight = typeof geofsAlt === 'number' && !isNaN(geofsAlt) ? geofsAlt : 0;
          } else {
            groundHeight = Util.feetToMeters(this.options.defaultAltitudeFt || 0);
          }

          // Offset height slightly above terrain level to avoid clipping
          const finalHeight = groundHeight + (this.options.terrainOffsetMeters || 30);
          const h = this.options.heightReference === 'clamp' ? 0 : finalHeight;
          positions[idx] = Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, h);
        });
      }

      return positions;
    }

    // Non-blocking rendering
    async _render() {
      const token = ++this._renderToken;
      const opts = this.options;
      const waypoints = opts.filter ? this._waypoints.filter(opts.filter) : this._waypoints;
      const indexed = waypoints.map(wp => ({ wp, index: this._waypoints.indexOf(wp) }));

      // Step 1: Async position resolution
      const positions = await this._resolvePositionsAsync(indexed, token);
      if (token !== this._renderToken) return;

      // Step 2: Clear old visual entities
      this._dataSource.entities.removeAll();

      // Step 3: Batch build entities asynchronously without blocking main thread
      await this._buildEntitiesAsync(indexed, positions, token);
    }

    async _buildEntitiesAsync(indexed, positions, token) {
      const opts = this.options;
      const batchSize = 40;

      const scaleScalar = (opts.scaleByDistance && Array.isArray(opts.scaleByDistanceParams))
        ? new Cesium.NearFarScalar(...opts.scaleByDistanceParams)
        : undefined;

      for (let i = 0; i < indexed.length; i++) {
        if (token !== this._renderToken) return;

        // Yield to browser event loop every batchSize items to remain non-blocking
        if (i > 0 && i % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
          if (token !== this._renderToken) return;
        }

        const { wp, index } = indexed[i];
        const position = positions[i];
        if (!position) continue;

        const typeStyle = this._resolveTypeStyle(wp.type);
        const isActive = opts.activeIndex !== null && opts.activeIndex === index;
        const hasTrack = Util.toNumber(wp.track, null) !== null;

        const entityOptions = {
          id: `${this._id}-wp-${index}`,
          position,
          description: opts.descriptionFormatter
            ? opts.descriptionFormatter(wp, index)
            : this._defaultDescription(wp)
        };

        if (opts.showPoints) {
          if (opts.showHeadingArrows && hasTrack) {
            const cssColor = isActive ? opts.activeStyle.color : typeStyle.color;
            entityOptions.billboard = new Cesium.BillboardGraphics({
              image: this._getArrowCanvas(cssColor),
              rotation: Util.headingToScreenRotation(wp.track),
              alignedAxis: Cesium.Cartesian3.UNIT_Z,
              scale: (isActive ? opts.activeStyle.pointSize : typeStyle.pointSize) / 16,
              heightReference: this._resolveHeightReferenceEnum(),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: scaleScalar
            });
          } else {
            entityOptions.point = new Cesium.PointGraphics({
              pixelSize: isActive ? opts.activeStyle.pointSize : typeStyle.pointSize,
              color: Util.toColor(isActive ? opts.activeStyle.color : typeStyle.color),
              outlineColor: Util.toColor(isActive ? (opts.activeStyle.outlineColor || opts.pointOutlineColor) : opts.pointOutlineColor),
              outlineWidth: opts.pointOutlineWidth,
              heightReference: this._resolveHeightReferenceEnum(),
              distanceDisplayCondition: opts.pointVisibilityDistance
                ? new Cesium.DistanceDisplayCondition(0, opts.pointVisibilityDistance)
                : undefined,
              scaleByDistance: scaleScalar
            });
          }
        }

        if (opts.showLabels) {
          entityOptions.label = new Cesium.LabelGraphics({
            text: opts.labelFormatter ? opts.labelFormatter(wp, index, this) : this._defaultLabelText(wp, index),
            font: opts.labelFont,
            fillColor: Util.toColor(opts.labelFillColor),
            outlineColor: Util.toColor(opts.labelOutlineColor),
            outlineWidth: opts.labelOutlineWidth,
            style: Cesium.LabelStyle[opts.labelStyle] ?? Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(opts.labelPixelOffset[0], opts.labelPixelOffset[1]),
            showBackground: opts.labelShowBackground,
            backgroundColor: Util.toColor(opts.labelBackgroundColor),
            heightReference: this._resolveHeightReferenceEnum(),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: opts.lablelHorizontalOrigin,
            distanceDisplayCondition: opts.labelVisibilityDistance
              ? new Cesium.DistanceDisplayCondition(0, opts.labelVisibilityDistance)
              : undefined,
            scaleByDistance: scaleScalar
          });
        }

        const entity = this._dataSource.entities.add(entityOptions);
        entity._geofsWaypointIndex = index;
        entity._geofsWaypointData = wp;
      }

      if (opts.showPath && indexed.length > 1) {
        this._renderPath(indexed, positions);
      }
    }

    _renderPath(indexed, positions) {
      const opts = this.options;

      if (opts.pathColorMode === 'byType') {
        for (let i = 0; i < indexed.length - 1; i++) {
          const from = indexed[i];
          const style = this._resolveTypeStyle(from.wp.type);
          const material = opts.pathStyle === 'dashed'
            ? new Cesium.PolylineDashMaterialProperty({ color: Util.toColor(style.color, opts.pathAlpha) })
            : Util.toColor(style.color, opts.pathAlpha);

          this._dataSource.entities.add({
            id: `${this._id}-path-${i}`,
            polyline: new Cesium.PolylineGraphics({
              positions: [positions[i], positions[i + 1]],
              width: opts.pathWidth,
              material,
              clampToGround: opts.pathClampToGround
            })
          });
        }
      } else {
        const material = opts.pathStyle === 'dashed'
          ? new Cesium.PolylineDashMaterialProperty({ color: Util.toColor(opts.pathColor, opts.pathAlpha) })
          : Util.toColor(opts.pathColor, opts.pathAlpha);

        this._dataSource.entities.add({
          id: `${this._id}-path`,
          polyline: new Cesium.PolylineGraphics({
            positions: positions,
            width: opts.pathWidth,
            material,
            clampToGround: opts.pathClampToGround
          })
        });
      }
    }

    _setupPicking() {
      this._eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

      this._eventHandler.setInputAction((movement) => {
        if (!this.options.onWaypointClick) return;
        const picked = this.viewer.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id && picked.id._geofsWaypointData
            && this._dataSource.entities.contains(picked.id)) {
          this.options.onWaypointClick(picked.id._geofsWaypointData, picked.id._geofsWaypointIndex, picked.id);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      this._eventHandler.setInputAction((movement) => {
        if (!this.options.onWaypointHover) return;
        const picked = this.viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(picked) && picked.id && picked.id._geofsWaypointData
            && this._dataSource.entities.contains(picked.id)) {
          this.options.onWaypointHover(picked.id._geofsWaypointData, picked.id._geofsWaypointIndex, picked.id);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
  }

  global.GeoFSWaypointVisualizer = GeoFSWaypointVisualizer;

})(typeof window !== 'undefined' ? window : this);