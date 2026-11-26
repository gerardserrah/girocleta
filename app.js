/**
 * Girocleta Fullscreen WebApp
 * Modern Interactive Bicycle Map for Girona
 */

// Configuration & Default Settings
const CONFIG = {
  defaultCenter: [41.9835, 2.8220], // Girona Center
  defaultZoom: 14,
  cityBikApiUrl: 'https://api.citybik.es/v2/networks/girocleta',
  localDataUrl: 'stations.json',
  refreshIntervalMs: 60000, // Auto-refresh every 60s
  favStorageKey: 'girocleta_user_favorites',
  prefsStorageKey: 'girocleta_user_prefs',
  mapLayerStorageKey: 'girocleta_map_layer'
};

// Available Base Map Layers: 100% free, high reliability, zero API key required
const MAP_LAYERS = {
  positron: {
    id: 'positron',
    type: 'maplibre',
    name: 'Positron GL (OpenMapTiles)',
    desc: 'L\'estil vectorial Positron GL: disseny nítid, clar i minimalista. Ressalta al màxim les estacions de Girocleta.',
    badge: 'Per Defecte',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    previewClass: 'preview-positron'
  },
  cyclosm: {
    id: 'cyclosm',
    name: 'CyclOSM (Bicicletes & Carrils)',
    desc: 'Creat especialment per a ciclistes: destaca clarament els carrils bici de Girona, vies verdes i carrers 30.',
    badge: 'Ciclisme',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> | <a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a>',
      subdomains: 'abc',
      maxZoom: 19
    },
    previewClass: 'preview-cyclosm'
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap Clàssic',
    desc: 'El mapa cartogràfic de referència mundial amb tot el detall de carrers, noms i places de Girona.',
    badge: 'Clàssic',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19
    },
    previewClass: 'preview-osm'
  },
  osm_hot: {
    id: 'osm_hot',
    name: 'OSM Suau (Colors Pastel)',
    desc: 'Estil suau d\'alta llegibilitat que fa que les estacions de la Girocleta contrastin a la perfecció.',
    badge: 'Clar & Suau',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> | Humanitarian OSM',
      subdomains: 'abc',
      maxZoom: 19
    },
    previewClass: 'preview-osm-hot'
  },
  esri_streets: {
    id: 'esri_streets',
    name: 'Esri Carrers Urbans',
    desc: 'Cartografia viària neta i moderna d\'Esri amb edificis i vials d\'alta resolució.',
    badge: 'Urbà',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ',
      maxZoom: 19
    },
    previewClass: 'preview-esri-streets'
  },
  esri_dark: {
    id: 'esri_dark',
    name: 'Esri Mode Fosc',
    desc: 'Mode fosc d\'alt contrast per a la nit: les estacions verdes de Girocleta destaquen al màxim.',
    badge: 'Mode Fosc',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    },
    previewClass: 'preview-esri-dark'
  },
  esri_satellite: {
    id: 'esri_satellite',
    name: 'Esri Satèl·lit (Fotografia Aèria)',
    desc: 'Ortofoto real en alta resolució per veure carrers, el riu Onyar i els parcs de Girona des de l\'espai.',
    badge: 'Satèl·lit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    },
    previewClass: 'preview-esri-satellite'
  },
  opentopo: {
    id: 'opentopo',
    name: 'OpenTopoMap (Relleu & Desnivells)',
    desc: 'Mapa amb corbes de nivell topogràfiques per mesurar els pendents i desnivells de Girona.',
    badge: 'Topogràfic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> | Style: OpenTopoMap',
      maxZoom: 17
    },
    previewClass: 'preview-opentopo'
  }
};

// Automatic migration & default to Positron GL style
function getInitialMapLayerKey() {
  const saved = localStorage.getItem(CONFIG.mapLayerStorageKey);
  const hasMigrated = localStorage.getItem('girocleta_positron_migrated_v1');
  if (!hasMigrated) {
    localStorage.setItem('girocleta_positron_migrated_v1', 'true');
    localStorage.setItem(CONFIG.mapLayerStorageKey, 'positron');
    return 'positron';
  }
  if (!saved || !MAP_LAYERS[saved]) {
    localStorage.setItem(CONFIG.mapLayerStorageKey, 'positron');
    return 'positron';
  }
  return saved;
}

// Application State
const state = {
  map: null,
  currentTileLayer: null,
  currentLayerKey: getInitialMapLayerKey(),
  stations: [],
  stationMarkers: {},
  userMarker: null,
  userLocation: null,
  favorites: new Set(),
  preferences: null,
  swRegistration: null,
  activeFilter: 'all',
  searchQuery: '',
  drawerMode: 'list', // 'list', 'favorites', 'nearby'
  isUpdating: false
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  loadPreferences();
  initMap();
  bindUIEvents();
  loadStationData();
  initServiceWorker();
  
  // Set up auto-refresh
  setInterval(() => {
    refreshData(true);
  }, CONFIG.refreshIntervalMs);

  // Set up periodic push notification checker (checks every 30s)
  setInterval(() => {
    checkScheduledNotifications();
  }, 30000);
});

/**
 * Initialize Leaflet Map with rotation and dynamic tile layers
 */
function initMap() {
  state.map = L.map('map', {
    zoomControl: false,
    minZoom: 12,
    maxZoom: 19,
    rotate: true,
    touchRotate: true,
    shiftKeyRotate: true,
    bearing: 0,
    rotateControl: false
  }).setView(CONFIG.defaultCenter, CONFIG.defaultZoom);

  // Apply saved or default tile layer
  applyTileLayer(state.currentLayerKey, false);

  // Zoom control in bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  // Listen to map rotation changes to update compass needle
  state.map.on('rotate', updateCompassUI);

  // Expose global references for convenience & debugging
  window.giroMap = state.map;
  window.state = state;

  // Click on map closes open drawer on mobile
  state.map.on('click', () => {
    if (window.innerWidth <= 640 && isDrawerOpen()) {
      closeDrawer();
    }
  });
}

// ==========================================================================
// Data Fetching & Sync
// ==========================================================================
async function loadStationData() {
  updateStatus('Carregant estacions...', false);

  try {
    // 1. First load bundled static data for instant render
    const localRes = await fetch(CONFIG.localDataUrl);
    if (localRes.ok) {
      state.stations = await localRes.json();
      renderAllMarkers();
      updateQuickStats();
      renderStationsList();
      updateNotificationPreview();
    }

    // 2. Fetch live updates from CityBik API
    await fetchLiveCityBikData();
  } catch (err) {
    console.warn('Error loading initial data:', err);
    updateStatus('Sense dades en viu', false);
  }
}

async function fetchLiveCityBikData() {
  try {
    const res = await fetch(CONFIG.cityBikApiUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (data && data.network && data.network.stations) {
      const liveList = data.network.stations;

      // Merge live data with our stations
      state.stations.forEach(station => {
        // match by name or coordinates distance
        const liveMatch = liveList.find(s => {
          if (s.extra && s.extra.uid && parseInt(s.extra.uid, 10) === station.id) return true;
          // match by coordinate closeness
          const d = getDistanceMeters(station.lat, station.lon, s.latitude, s.longitude);
          return d < 80;
        });

        if (liveMatch) {
          station.bikes = liveMatch.free_bikes ?? station.bikes;
          station.slots = liveMatch.empty_slots ?? station.slots;
          station.capacity = station.bikes + station.slots;
        }
      });

      renderAllMarkers();
      updateQuickStats();
      renderStationsList();
      updateNotificationPreview();

      const timeStr = new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
      updateStatus(`En directe (${timeStr})`, true);
    }
  } catch (err) {
    console.warn('Could not fetch CityBik live data:', err);
    updateStatus('Dades locals actives', false);
  }
}

async function refreshData(isAuto = false) {
  if (state.isUpdating) return;
  state.isUpdating = true;
  
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  if (!isAuto) showToast('Actualitzant dades de Girocleta...');

  await fetchLiveCityBikData();

  setTimeout(() => {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
    state.isUpdating = false;
  }, 600);
}

function updateStatus(text, isLive) {
  const statusEl = document.getElementById('status-text');
  const dot = document.querySelector('.status-dot');
  if (statusEl) statusEl.textContent = text;
  if (dot) {
    dot.style.backgroundColor = isLive ? '#10b981' : '#f59e0b';
  }
}

// ==========================================================================
// Map Markers & Popups
// ==========================================================================
function renderAllMarkers() {
  // Clear existing markers
  Object.values(state.stationMarkers).forEach(m => state.map.removeLayer(m));
  state.stationMarkers = {};

  state.stations.forEach(station => {
    const isFav = state.favorites.has(station.id);
    
    // Determine bike availability color
    let bikeStatus = 'status-high';
    if (station.bikes === 0) bikeStatus = 'status-empty';
    else if (station.bikes <= 4) bikeStatus = 'status-medium';

    // Determine parking slot status
    const slotStatus = station.slots === 0 ? 'status-empty-slots' : '';

    const customIcon = L.divIcon({
      className: 'custom-giro-icon',
      html: `
        <div class="giro-dual-marker" data-id="${station.id}">
          <div class="dual-badge-pill">
            <div class="badge-side bikes ${bikeStatus}" title="${station.bikes} bicis disponibles">
              <i class="fa-solid fa-bicycle"></i>
              <span class="badge-num">${station.bikes}</span>
            </div>
            <div class="badge-divider"></div>
            <div class="badge-side slots ${slotStatus}" title="${station.slots} llocs lliures">
              <i class="fa-solid fa-square-parking"></i>
              <span class="badge-num">${station.slots}</span>
            </div>
            ${isFav ? '<div class="marker-fav-badge"><i class="fa-solid fa-star"></i></div>' : ''}
          </div>
          <div class="dual-pin-arrow"></div>
        </div>
      `,
      iconSize: [86, 36],
      iconAnchor: [43, 36],
      popupAnchor: [0, -34]
    });

    const marker = L.marker([station.lat, station.lon], { icon: customIcon });

    marker.bindPopup(() => createPopupContent(station), {
      maxWidth: 290,
      className: 'giro-custom-popup'
    });

    marker.addTo(state.map);
    state.stationMarkers[station.id] = marker;
  });
}

function createPopupContent(station) {
  const isFav = state.favorites.has(station.id);
  const total = (station.bikes + station.slots) || 1;
  const bikePercent = Math.round((station.bikes / total) * 100);
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}&travelmode=walking`;

  return `
    <div class="popup-card">
      <div class="popup-header">
        <div>
          <span class="popup-id-badge">Estació ${station.code || station.id}</span>
          <h3 class="popup-title">${station.name}</h3>
        </div>
        <button class="popup-fav-btn ${isFav ? 'is-favorite' : ''}" 
                onclick="toggleFavorite(${station.id})" 
                title="${isFav ? 'Treure de preferides' : 'Afegir a preferides'}">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
        </button>
      </div>

      <div class="popup-address">
        <i class="fa-solid fa-location-dot"></i>
        <span>${station.address || 'Girona'}</span>
      </div>

      <div class="popup-stats-grid">
        <div class="popup-stat-box bikes-box">
          <span class="stat-box-number">${station.bikes}</span>
          <span class="stat-box-label"><i class="fa-solid fa-bicycle"></i> Bicis</span>
        </div>
        <div class="popup-stat-box slots-box">
          <span class="stat-box-number">${station.slots}</span>
          <span class="stat-box-label"><i class="fa-solid fa-square-parking"></i> Lliures</span>
        </div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-bottom:3px; font-weight:600;">
          <span>Ocupació bicis</span>
          <span>${bikePercent}%</span>
        </div>
        <div class="popup-occupancy-bar">
          <div class="occupancy-fill" style="width: ${bikePercent}%;"></div>
        </div>
      </div>

      <div class="popup-actions">
        <a href="${gmapsUrl}" target="_blank" rel="noopener" class="popup-btn primary">
          <i class="fa-solid fa-diamond-turn-right"></i> Com arribar-hi
        </a>
      </div>
    </div>
  `;
}

// ==========================================================================
// Favorites Management
// ==========================================================================
function loadFavorites() {
  try {
    const raw = localStorage.getItem(CONFIG.favStorageKey);
    if (raw) {
      const arr = JSON.parse(raw);
      state.favorites = new Set(arr);
    }
  } catch (e) {
    state.favorites = new Set();
  }
  updateFavoritesBadge();
}

function saveFavorites() {
  try {
    localStorage.setItem(CONFIG.favStorageKey, JSON.stringify([...state.favorites]));
  } catch (e) {
    console.error('Failed saving favorites to localStorage', e);
  }
  updateFavoritesBadge();
}

function toggleFavorite(stationId) {
  if (state.favorites.has(stationId)) {
    state.favorites.delete(stationId);
    showToast('Estació eliminada de preferides');
  } else {
    state.favorites.add(stationId);
    showToast('Estació afegida a preferides ⭐');
  }
  saveFavorites();
  renderAllMarkers();
  renderStationsList();

  // If a popup is open for this station, update its star
  const marker = state.stationMarkers[stationId];
  if (marker && marker.isPopupOpen()) {
    marker.setPopupContent(createPopupContent(state.stations.find(s => s.id === stationId)));
  }
}

function updateFavoritesBadge() {
  const badge = document.getElementById('fav-count-badge');
  const countFavsTab = document.getElementById('count-favs');
  const countPrefFavs = document.getElementById('pref-fav-count');
  const count = state.favorites.size;

  if (countPrefFavs) countPrefFavs.textContent = count;

  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  if (countFavsTab) {
    countFavsTab.textContent = count;
  }
}

// ==========================================================================
// User Geolocation & Nearby Stations
// ==========================================================================
function findNearbyStations() {
  if (!navigator.geolocation) {
    showToast('El teu navegador no suporta la geolocalització');
    return;
  }

  showToast('Obtenint la teva ubicació...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      state.userLocation = { lat: latitude, lon: longitude };

      // Add or update radar user marker
      if (!state.userMarker) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div class="user-radar-marker">
              <div class="user-radar-pulse"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        state.userMarker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(state.map);
        state.userMarker.bindPopup('<b>La teva ubicació</b>');
      } else {
        state.userMarker.setLatLng([latitude, longitude]);
      }

      // Calculate distance from user to all stations
      state.stations.forEach(s => {
        s.distanceMeters = getDistanceMeters(latitude, longitude, s.lat, s.lon);
      });

      // Fly to user location
      state.map.flyTo([latitude, longitude], 15, { duration: 1.2 });

      // Open drawer sorted by distance
      state.drawerMode = 'nearby';
      openDrawer('Estacions més properes', 'Ordenades per distància a peu');
      renderStationsList();

      showToast('Ubicació trobada! Estacions ordenades per distància.');
    },
    (err) => {
      console.warn('Geolocation error:', err);
      showToast('No s\'ha pogut accedir a la teva ubicació.');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// Haversine formula to calculate distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
}

function formatDistance(meters) {
  if (!meters && meters !== 0) return '';
  if (meters < 1000) {
    const mins = Math.max(1, Math.round(meters / 80)); // ~80m/min walking speed
    return `${meters} m • ~${mins} min a peu`;
  }
  const km = (meters / 1000).toFixed(1);
  const mins = Math.round(meters / 80);
  return `${km} km • ~${mins} min`;
}

// ==========================================================================
// Side Drawer (List, Favorites, Nearby)
// ==========================================================================
function openDrawer(title = 'Llistat d\'estacions', subtitle = '36 estacions a Girona') {
  const drawer = document.getElementById('side-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const titleEl = document.getElementById('drawer-title');
  const subtitleEl = document.getElementById('drawer-subtitle');

  if (titleEl) titleEl.innerHTML = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  drawer.classList.add('open');
  overlay.classList.add('active');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  const drawer = document.getElementById('side-drawer');
  const overlay = document.getElementById('drawer-overlay');
  
  drawer.classList.remove('open');
  overlay.classList.remove('active');
  drawer.setAttribute('aria-hidden', 'true');

  // De-activate list / favorites buttons if closing
  document.querySelectorAll('.action-nav .nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-nav-home').classList.add('active');
}

function isDrawerOpen() {
  return document.getElementById('side-drawer').classList.contains('open');
}

function renderStationsList() {
  const listContainer = document.getElementById('stations-list');
  if (!listContainer) return;

  // Filter stations
  let filtered = [...state.stations];

  // 1. Text Search Filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.code.includes(q)
    );
  }

  // 2. Tab Filter
  if (state.activeFilter === 'has-bikes') {
    filtered = filtered.filter(s => s.bikes > 0);
  } else if (state.activeFilter === 'has-slots') {
    filtered = filtered.filter(s => s.slots > 0);
  } else if (state.activeFilter === 'favs') {
    filtered = filtered.filter(s => state.favorites.has(s.id));
  }

  // 3. Sorting
  if (state.drawerMode === 'nearby' && state.userLocation) {
    filtered.sort((a, b) => (a.distanceMeters || 999999) - (b.distanceMeters || 999999));
  } else {
    filtered.sort((a, b) => a.id - b.id);
  }

  // Render HTML
  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>No s'ha trobat cap estació amb aquests criteris.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(station => {
    const isFav = state.favorites.has(station.id);
    const distText = station.distanceMeters ? formatDistance(station.distanceMeters) : '';

    return `
      <div class="station-card" onclick="flyToStation(${station.id})">
        <div class="station-card-top">
          <div class="station-card-info">
            <span class="station-card-code">Estació ${station.code}</span>
            <h4 class="station-card-name">${station.name}</h4>
            <div class="station-card-addr"><i class="fa-solid fa-location-dot"></i> ${station.address}</div>
            ${distText ? `<div class="station-card-distance"><i class="fa-solid fa-person-walking"></i> ${distText}</div>` : ''}
          </div>
          <button class="station-card-fav-btn ${isFav ? 'is-favorite' : ''}" 
                  onclick="event.stopPropagation(); toggleFavorite(${station.id})"
                  title="${isFav ? 'Treure de preferides' : 'Afegir a preferides'}">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
          </button>
        </div>

        <div class="station-card-bottom">
          <div class="station-chips">
            <span class="station-chip bikes"><i class="fa-solid fa-bicycle"></i> ${station.bikes} bicis</span>
            <span class="station-chip slots"><i class="fa-solid fa-square-parking"></i> ${station.slots} lliures</span>
          </div>
          <span class="btn-locate-card">
            Veure al mapa <i class="fa-solid fa-chevron-right"></i>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function flyToStation(stationId) {
  const station = state.stations.find(s => s.id === stationId);
  if (!station) return;

  state.map.flyTo([station.lat, station.lon], 16, { duration: 1 });

  const marker = state.stationMarkers[stationId];
  if (marker) {
    setTimeout(() => {
      marker.openPopup();
    }, 700);
  }

  if (window.innerWidth <= 640) {
    closeDrawer();
  }
}

// ==========================================================================
// Quick Stats & Badges
// ==========================================================================
function updateQuickStats() {
  const totalBikes = state.stations.reduce((acc, s) => acc + (s.bikes || 0), 0);
  const totalSlots = state.stations.reduce((acc, s) => acc + (s.slots || 0), 0);

  const bikesEl = document.getElementById('total-bikes');
  const slotsEl = document.getElementById('total-slots');
  const countAllEl = document.getElementById('count-all');
  const countBikesEl = document.getElementById('count-bikes');
  const countSlotsEl = document.getElementById('count-slots');

  if (bikesEl) bikesEl.textContent = totalBikes;
  if (slotsEl) slotsEl.textContent = totalSlots;
  if (countAllEl) countAllEl.textContent = state.stations.length;
  if (countBikesEl) countBikesEl.textContent = state.stations.filter(s => s.bikes > 0).length;
  if (countSlotsEl) countSlotsEl.textContent = state.stations.filter(s => s.slots > 0).length;
}

// ==========================================================================
// UI Event Listeners
// ==========================================================================
function bindUIEvents() {
  // Brand Home Click
  document.getElementById('btn-brand-home')?.addEventListener('click', goHome);

  // 1. Home Button
  document.getElementById('btn-nav-home')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-home');
    goHome();
  });

  // 2. Favorites Button
  document.getElementById('btn-nav-favorites')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-favorites');
    if (state.favorites.size === 0) {
      showToast('Encara no tens preferides. Fes clic a l\'estrella d\'una estació!');
    }
    state.drawerMode = 'favorites';
    state.activeFilter = 'favs';
    
    // Update filter tabs UI
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-filter') === 'favs');
    });

    openDrawer('<i class="fa-solid fa-star" style="color:#f59e0b"></i> Estacions preferides', `${state.favorites.size} estacions guardades`);
    renderStationsList();
  });

  // 3. List Button
  document.getElementById('btn-nav-list')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-list');
    state.drawerMode = 'list';
    state.activeFilter = 'all';

    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-filter') === 'all');
    });

    openDrawer('<i class="fa-solid fa-list-ul"></i> Llistat d\'estacions', `${state.stations.length} estacions a Girona`);
    renderStationsList();
  });

  // 4. Nearby Button
  document.getElementById('btn-nav-nearby')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-nearby');
    findNearbyStations();
  });

  // 5. Alerts & Preferences Button
  document.getElementById('btn-nav-alerts')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-alerts');
    openPreferencesModal();
  });

  // 6. Map Layers Switcher Button
  document.getElementById('btn-nav-layers')?.addEventListener('click', () => {
    setActiveNavBtn('btn-nav-layers');
    openLayersModal();
  });

  // Map Compass Needle (Click to return to North)
  document.getElementById('btn-map-compass')?.addEventListener('click', resetMapOrientation);

  // Layers Modal Close Buttons
  document.getElementById('btn-close-layers')?.addEventListener('click', closeLayersModal);
  document.getElementById('modal-layers-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-layers-overlay') closeLayersModal();
  });

  // iOS Safari Guide Modal Close Buttons
  document.getElementById('btn-close-ios-guide')?.addEventListener('click', closeIOSGuideModal);
  document.getElementById('btn-dismiss-ios-guide')?.addEventListener('click', closeIOSGuideModal);
  document.getElementById('modal-ios-guide-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-ios-guide-overlay') closeIOSGuideModal();
  });

  // Refresh Button
  document.getElementById('btn-refresh')?.addEventListener('click', () => refreshData(false));

  // Drawer Close Button & Overlay
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);

  // Search input
  const searchInput = document.getElementById('station-search');
  const clearSearchBtn = document.getElementById('clear-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      renderStationsList();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderStationsList();
    });
  }

  // Filter tabs inside drawer
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeFilter = tab.getAttribute('data-filter');
      renderStationsList();
    });
  });

  // Modal de Personalització & Alertes
  bindPreferencesEvents();
}

function setActiveNavBtn(btnId) {
  document.querySelectorAll('.action-nav .nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(btnId)?.classList.add('active');
}

function goHome() {
  if (isDrawerOpen()) closeDrawer();
  state.map.flyTo(CONFIG.defaultCenter, CONFIG.defaultZoom, { duration: 1.2 });
  showToast('Mapa centrat a Girona');
}

// Toast helper
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ==========================================================================
// Base Map Layers Controller & Customization
// ==========================================================================
function applyTileLayer(layerKey, notify = true) {
  let actualKey = layerKey;
  if (!MAP_LAYERS[actualKey]) {
    if (actualKey === 'voyager') actualKey = 'positron';
    else if (actualKey === 'dark') actualKey = 'esri_dark';
    else if (actualKey === 'esri') actualKey = 'esri_satellite';
    else actualKey = 'positron';
  }
  const layerCfg = MAP_LAYERS[actualKey];

  if (state.currentTileLayer && state.map.hasLayer(state.currentTileLayer)) {
    state.map.removeLayer(state.currentTileLayer);
  }

  if (layerCfg.type === 'maplibre' && typeof L.maplibreGL === 'function') {
    state.currentTileLayer = L.maplibreGL({
      style: layerCfg.styleUrl
    }).addTo(state.map);
  } else {
    state.currentTileLayer = L.tileLayer(layerCfg.url, layerCfg.options).addTo(state.map);
  }

  if (state.currentTileLayer && state.currentTileLayer.bringToBack) {
    state.currentTileLayer.bringToBack();
  }

  state.currentLayerKey = actualKey;
  localStorage.setItem(CONFIG.mapLayerStorageKey, actualKey);

  renderLayersGrid();

  if (notify) {
    showToast(`Mapa canviat a: ${layerCfg.name}`);
  }
}

function openLayersModal() {
  renderLayersGrid();
  const overlay = document.getElementById('modal-layers-overlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function closeLayersModal() {
  const overlay = document.getElementById('modal-layers-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (document.getElementById('btn-nav-layers')?.classList.contains('active')) {
    setActiveNavBtn('btn-nav-home');
  }
}

function renderLayersGrid() {
  const grid = document.getElementById('map-layers-grid');
  if (!grid) return;

  grid.innerHTML = Object.values(MAP_LAYERS).map(l => {
    const isActive = l.id === state.currentLayerKey;
    return `
      <div class="layer-card ${isActive ? 'active' : ''}" data-layer="${l.id}" onclick="selectMapLayer('${l.id}')">
        <div class="layer-preview-thumbnail ${l.previewClass}">
          <div class="layer-preview-badge">${l.badge}</div>
          <div class="layer-active-indicator"><i class="fa-solid fa-circle-check"></i> Actiu</div>
        </div>
        <div class="layer-card-body">
          <div class="layer-card-title">${l.name}</div>
          <div class="layer-card-desc">${l.desc}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.selectMapLayer = function(layerKey) {
  applyTileLayer(layerKey, true);
};

// ==========================================================================
// Map Rotation & Compass
// ==========================================================================
function updateCompassUI() {
  const compassBtn = document.getElementById('btn-map-compass');
  const dial = document.getElementById('compass-dial');
  if (!state.map || !compassBtn || !dial) return;

  const bearing = (typeof state.map.getBearing === 'function') ? state.map.getBearing() : 0;
  dial.style.transform = `rotate(${-bearing}deg)`;

  const isRotated = Math.abs(bearing) > 0.5;
  compassBtn.classList.toggle('has-rotation', isRotated);
}

function resetMapOrientation() {
  if (state.map && typeof state.map.setBearing === 'function') {
    state.map.setBearing(0);
    showToast('Mapa orientat al Nord');
  }
}

// ==========================================================================
// iOS Safari Web Push Support & Guide Modal
// ==========================================================================
function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isStandalonePWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function openIOSGuideModal() {
  const overlay = document.getElementById('modal-ios-guide-overlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function closeIOSGuideModal() {
  const overlay = document.getElementById('modal-ios-guide-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

// ==========================================================================
// Personalització & Notificacions Push (Girocleta Preferences)
// ==========================================================================
const DEFAULT_PREFERENCES = {
  notificationsEnabled: false,
  targetMode: 'favorites', // 'favorites' | 'custom'
  customStationIds: [],
  daysMode: 'weekdays', // 'all' | 'weekdays' | 'weekends'
  scheduleMode: 'times', // 'times' | 'interval'
  scheduleTimes: ['08:00', '14:00', '19:00'],
  intervalOption: '30', // '15', '30', '60'
  intervalStart: '07:30',
  intervalEnd: '21:30',
  alertOnlyIfLowBikes: false,
  minBikesThreshold: 3,
  alertOnlyIfLowSlots: false,
  minSlotsThreshold: 3,
  lastNotifiedKey: ''
};

function loadPreferences() {
  try {
    const raw = localStorage.getItem(CONFIG.prefsStorageKey);
    if (raw) {
      state.preferences = Object.assign({}, DEFAULT_PREFERENCES, JSON.parse(raw));
    } else {
      state.preferences = Object.assign({}, DEFAULT_PREFERENCES);
    }
  } catch (e) {
    state.preferences = Object.assign({}, DEFAULT_PREFERENCES);
  }
  updateAlertBadge();
}

function savePreferences(notifyUser = true) {
  try {
    localStorage.setItem(CONFIG.prefsStorageKey, JSON.stringify(state.preferences));
  } catch (e) {
    console.error('Error saving preferences', e);
  }
  updateAlertBadge();
  if (notifyUser) {
    showToast('Preferències d\'alertes desades correctament!');
  }
}

function updateAlertBadge() {
  const badge = document.getElementById('alert-active-badge');
  if (badge) {
    badge.style.display = (state.preferences && state.preferences.notificationsEnabled) ? 'inline-block' : 'none';
  }
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      state.swRegistration = reg;
      console.log('Girocleta Service Worker actiu');
    }).catch((err) => {
      console.warn('Girocleta SW warning:', err);
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SELECT_STATION' && event.data.stationId) {
        selectStationById(event.data.stationId);
      }
    });
  }
}

function selectStationById(stationId) {
  const station = state.stations.find(s => String(s.id) === String(stationId));
  if (station && state.map) {
    if (isDrawerOpen()) closeDrawer();
    closePreferencesModal();
    state.map.flyTo([station.lat, station.lon], 17, { duration: 1 });
    const marker = state.stationMarkers[station.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 900);
    }
  }
}

// Preferences Modal Open & Close
function openPreferencesModal() {
  const overlay = document.getElementById('modal-prefs-overlay');
  if (!overlay) return;

  // Sync Form with State
  const prefs = state.preferences || DEFAULT_PREFERENCES;

  // Permission Banner
  updatePermissionBanner();

  // Master Toggle
  const toggleNotifs = document.getElementById('toggle-notifs-active');
  const configContainer = document.getElementById('pref-config-container');
  if (toggleNotifs) {
    toggleNotifs.checked = !!prefs.notificationsEnabled;
  }
  if (configContainer) {
    configContainer.classList.toggle('disabled', !prefs.notificationsEnabled);
  }

  // Counts
  const favCountEl = document.getElementById('pref-fav-count');
  if (favCountEl) favCountEl.textContent = state.favorites.size;
  const customCountEl = document.getElementById('pref-custom-count');
  if (customCountEl) customCountEl.textContent = prefs.customStationIds.length;

  // Target Mode Segmented
  document.querySelectorAll('#seg-target-mode .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === prefs.targetMode);
  });
  const customStationsDiv = document.getElementById('pref-custom-stations');
  if (customStationsDiv) {
    customStationsDiv.style.display = (prefs.targetMode === 'custom') ? 'flex' : 'none';
  }

  // Schedule Mode Segmented
  document.querySelectorAll('#seg-schedule-mode .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-schedule') === prefs.scheduleMode);
  });
  const timesPanel = document.getElementById('pref-schedule-times-panel');
  const intervalPanel = document.getElementById('pref-schedule-interval-panel');
  if (timesPanel) timesPanel.style.display = (prefs.scheduleMode === 'times') ? 'block' : 'none';
  if (intervalPanel) intervalPanel.style.display = (prefs.scheduleMode === 'interval') ? 'block' : 'none';

  // Days Mode Segmented
  document.querySelectorAll('#seg-days-mode .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-days') === prefs.daysMode);
  });

  // Interval inputs
  const intRadio = document.querySelector(`input[name="interval-option"][value="${prefs.intervalOption}"]`);
  if (intRadio) intRadio.checked = true;
  const intStart = document.getElementById('interval-start');
  if (intStart) intStart.value = prefs.intervalStart || '07:30';
  const intEnd = document.getElementById('interval-end');
  if (intEnd) intEnd.value = prefs.intervalEnd || '21:30';

  // Optional conditions
  const chkBikes = document.getElementById('check-low-bikes');
  if (chkBikes) chkBikes.checked = !!prefs.alertOnlyIfLowBikes;
  const numBikes = document.getElementById('num-min-bikes');
  if (numBikes) numBikes.value = prefs.minBikesThreshold || 3;

  const chkSlots = document.getElementById('check-low-slots');
  if (chkSlots) chkSlots.checked = !!prefs.alertOnlyIfLowSlots;
  const numSlots = document.getElementById('num-min-slots');
  if (numSlots) numSlots.value = prefs.minSlotsThreshold || 3;

  renderTimeChips();
  renderPrefStationsGrid();
  updateNotificationPreview();

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closePreferencesModal() {
  const overlay = document.getElementById('modal-prefs-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  // De-activate alerts nav button if active
  if (document.getElementById('btn-nav-alerts')?.classList.contains('active')) {
    setActiveNavBtn('btn-nav-home');
  }
}

function updatePermissionBanner() {
  const banner = document.getElementById('pref-perm-banner');
  const btn = document.getElementById('btn-request-perm');
  const title = document.getElementById('perm-status-title');
  const desc = document.getElementById('perm-status-desc');
  if (!banner || !btn) return;

  const hasNotif = ('Notification' in window);
  const perm = hasNotif ? Notification.permission : 'unsupported';
  banner.className = 'pref-permission-banner ' + perm;

  if (perm === 'granted') {
    title.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i> Permís concedit';
    desc.textContent = 'El navegador permet rebre notificacions d\'aquesta aplicació.';
    btn.style.display = 'none';
  } else if (perm === 'denied') {
    title.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#dc2626;"></i> Permís blocat al navegador';
    desc.textContent = 'Has denegat les notificacions. Activa-les als paràmetres del navegador si vols avisos.';
    btn.style.display = 'none';
  } else if (perm === 'unsupported') {
    if (isIOSDevice() && !isStandalonePWA()) {
      title.innerHTML = '<i class="fa-brands fa-apple" style="color:#1e293b;"></i> Requeriment a l\'iPhone / iPad';
      desc.textContent = 'A Safari cal afegir la Girocleta a la pantalla d\'inici per activar notificacions push.';
      btn.style.display = 'inline-flex';
      btn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket"></i> Com activar a l\'iPhone';
    } else {
      title.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color:#f59e0b;"></i> Sense suport de notificacions';
      desc.textContent = 'Aquest navegador no admet notificacions push web.';
      btn.style.display = 'none';
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Permís del navegador';
    desc.textContent = 'Cal concedir permís per rebre notificacions push al teu dispositiu.';
    btn.style.display = 'inline-flex';
    btn.innerHTML = '<i class="fa-solid fa-bell"></i> Activa el permís';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    if (isIOSDevice() && !isStandalonePWA()) {
      openIOSGuideModal();
      return;
    }
    showToast('Aquest navegador no admet la Notification API.');
    return;
  }
  Notification.requestPermission().then((permission) => {
    updatePermissionBanner();
    if (permission === 'granted') {
      showToast('Permís de notificacions concedit!');
      const toggle = document.getElementById('toggle-notifs-active');
      if (toggle && !toggle.checked) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
    } else if (permission === 'denied') {
      showToast('Permís de notificacions denegat.');
    }
  });
}

// Render Time Chips (e.g. 08:00, 14:00)
function renderTimeChips() {
  const container = document.getElementById('time-chips-container');
  if (!container) return;
  container.innerHTML = '';

  const times = (state.preferences && state.preferences.scheduleTimes) ? state.preferences.scheduleTimes : ['08:00', '14:00', '19:00'];
  times.sort().forEach(t => {
    const chip = document.createElement('div');
    chip.className = 'time-chip';
    chip.innerHTML = `<span>${t}</span><i class="fa-solid fa-circle-xmark time-chip-del" title="Eliminar ${t}"></i>`;
    chip.querySelector('.time-chip-del').addEventListener('click', () => {
      state.preferences.scheduleTimes = state.preferences.scheduleTimes.filter(item => item !== t);
      renderTimeChips();
    });
    container.appendChild(chip);
  });
}

// Render Checkbox Grid for Custom Stations
function renderPrefStationsGrid(filter = '') {
  const container = document.getElementById('pref-stations-grid');
  if (!container) return;
  container.innerHTML = '';

  const customIds = new Set(state.preferences.customStationIds || []);
  let stations = state.stations;
  if (filter.trim()) {
    const q = filter.trim().toLowerCase();
    stations = stations.filter(s => s.name.toLowerCase().includes(q) || (s.code && s.code.includes(q)));
  }

  stations.forEach(station => {
    const item = document.createElement('label');
    item.className = 'station-check-item';
    const isChecked = customIds.has(station.id);
    item.innerHTML = `
      <div class="station-check-left">
        <input type="checkbox" value="${station.id}" ${isChecked ? 'checked' : ''} class="custom-station-chk">
        <span><strong>${station.code || station.id}</strong> - ${station.name}</span>
      </div>
      <div class="station-check-badges">
        <span class="badge-mini-bikes">🚲 ${station.bikes}</span>
        <span class="badge-mini-slots">🅿️ ${station.slots}</span>
      </div>
    `;

    item.querySelector('.custom-station-chk').addEventListener('change', (e) => {
      if (e.target.checked) {
        customIds.add(station.id);
      } else {
        customIds.delete(station.id);
      }
      state.preferences.customStationIds = Array.from(customIds);
      const customCountEl = document.getElementById('pref-custom-count');
      if (customCountEl) customCountEl.textContent = state.preferences.customStationIds.length;
      updateNotificationPreview();
    });

    container.appendChild(item);
  });
}

// Live Notification Preview Card
function updateNotificationPreview() {
  const titleEl = document.getElementById('notif-prev-title');
  const bodyEl = document.getElementById('notif-prev-body');
  if (!titleEl || !bodyEl) return;

  let targetStation = null;
  if (state.preferences.targetMode === 'favorites' && state.favorites.size > 0) {
    const firstFavId = Array.from(state.favorites)[0];
    targetStation = state.stations.find(s => s.id === firstFavId);
  } else if (state.preferences.targetMode === 'custom' && state.preferences.customStationIds.length > 0) {
    const firstCustomId = state.preferences.customStationIds[0];
    targetStation = state.stations.find(s => s.id === firstCustomId);
  }

  if (!targetStation) {
    targetStation = state.stations[0] || { name: 'Plaça de Catalunya', code: '03', bikes: 14, slots: 12 };
  }

  titleEl.textContent = `Girocleta | ${targetStation.name}`;
  bodyEl.innerHTML = `<div>🚲 <strong>${targetStation.bikes} bicis disponibles</strong></div><div>🅿️ <strong>${targetStation.slots} llocs lliures</strong></div>`;
}

// Bind all Modal Interactions
function bindPreferencesEvents() {
  document.getElementById('btn-close-prefs')?.addEventListener('click', closePreferencesModal);
  document.getElementById('modal-prefs-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-prefs-overlay') closePreferencesModal();
  });

  // Request Permission Button
  document.getElementById('btn-request-perm')?.addEventListener('click', requestNotificationPermission);

  // Toggle Master Notifications
  const toggle = document.getElementById('toggle-notifs-active');
  toggle?.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    state.preferences.notificationsEnabled = enabled;
    document.getElementById('pref-config-container')?.classList.toggle('disabled', !enabled);
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
    updateAlertBadge();
  });

  // Segmented Target Mode (Favorites vs Custom)
  document.querySelectorAll('#seg-target-mode .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#seg-target-mode .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      state.preferences.targetMode = target;
      const customDiv = document.getElementById('pref-custom-stations');
      if (customDiv) customDiv.style.display = (target === 'custom') ? 'flex' : 'none';
      updateNotificationPreview();
    });
  });

  // Station search in preferences
  document.getElementById('pref-station-search')?.addEventListener('input', (e) => {
    renderPrefStationsGrid(e.target.value);
  });

  // Segmented Schedule Mode (Times vs Interval)
  document.querySelectorAll('#seg-schedule-mode .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#seg-schedule-mode .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sched = btn.getAttribute('data-schedule');
      state.preferences.scheduleMode = sched;
      document.getElementById('pref-schedule-times-panel').style.display = (sched === 'times') ? 'block' : 'none';
      document.getElementById('pref-schedule-interval-panel').style.display = (sched === 'interval') ? 'block' : 'none';
    });
  });

  // Add Time Button
  document.getElementById('btn-add-time')?.addEventListener('click', () => {
    const input = document.getElementById('new-time-input');
    if (!input || !input.value) return;
    const timeVal = input.value;
    if (!state.preferences.scheduleTimes.includes(timeVal)) {
      state.preferences.scheduleTimes.push(timeVal);
      renderTimeChips();
    } else {
      showToast(`L'hora ${timeVal} ja està afegida`);
    }
  });

  // Interval Options
  document.querySelectorAll('input[name="interval-option"]').forEach(r => {
    r.addEventListener('change', (e) => {
      state.preferences.intervalOption = e.target.value;
    });
  });

  document.getElementById('interval-start')?.addEventListener('change', (e) => {
    state.preferences.intervalStart = e.target.value;
  });
  document.getElementById('interval-end')?.addEventListener('change', (e) => {
    state.preferences.intervalEnd = e.target.value;
  });

  // Segmented Days Mode
  document.querySelectorAll('#seg-days-mode .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#seg-days-mode .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.preferences.daysMode = btn.getAttribute('data-days');
    });
  });

  // Filters
  document.getElementById('check-low-bikes')?.addEventListener('change', (e) => {
    state.preferences.alertOnlyIfLowBikes = e.target.checked;
  });
  document.getElementById('num-min-bikes')?.addEventListener('change', (e) => {
    state.preferences.minBikesThreshold = parseInt(e.target.value, 10) || 3;
  });

  document.getElementById('check-low-slots')?.addEventListener('change', (e) => {
    state.preferences.alertOnlyIfLowSlots = e.target.checked;
  });
  document.getElementById('num-min-slots')?.addEventListener('change', (e) => {
    state.preferences.minSlotsThreshold = parseInt(e.target.value, 10) || 3;
  });

  // Save Preferences Button
  document.getElementById('btn-save-prefs')?.addEventListener('click', () => {
    savePreferences(true);
    closePreferencesModal();
  });

  // Test Notification Button
  document.getElementById('btn-test-notif')?.addEventListener('click', sendTestNotification);
}

// Send Test Notification Now
function sendTestNotification() {
  if (!('Notification' in window)) {
    if (isIOSDevice() && !isStandalonePWA()) {
      openIOSGuideModal();
      return;
    }
    showToast('Aquest navegador no admet notificacions push.');
    executeTestNotification(); // Mostra el toast interactiu de prova
    return;
  }

  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(perm => {
      updatePermissionBanner();
      if (perm === 'granted') {
        executeTestNotification();
      } else {
        showToast('Cal autoritzar el permís per rebre la notificació al sistema.');
        executeTestNotification(); // Mostra igualment el toast com a simulació
      }
    });
  } else {
    executeTestNotification();
  }
}

function executeTestNotification() {
  let targetStation = null;
  if (state.preferences.targetMode === 'favorites' && state.favorites.size > 0) {
    const firstFavId = Array.from(state.favorites)[0];
    targetStation = state.stations.find(s => s.id === firstFavId);
  } else if (state.preferences.targetMode === 'custom' && state.preferences.customStationIds.length > 0) {
    const firstCustomId = state.preferences.customStationIds[0];
    targetStation = state.stations.find(s => s.id === firstCustomId);
  }

  if (!targetStation) {
    targetStation = state.stations[0] || { id: 3, code: '03', name: 'Plaça de Catalunya', bikes: 14, slots: 12 };
  }

  dispatchStationPushNotification(targetStation, true);
}

// Dispatch Station Notification with live bikes & slots
function dispatchStationPushNotification(station, isTest = false) {
  const title = `Girocleta | ${station.name}`;
  const body = `🚲 ${station.bikes} bicis disponibles\n🅿️ ${station.slots} llocs lliures${isTest ? ' (Prova)' : ''}`;
  const icon = 'girocleta_logo.png';
  const badge = 'girocleta-logo.svg';

  // 1. Try ServiceWorker Registration showNotification
  if (state.swRegistration && 'showNotification' in state.swRegistration) {
    state.swRegistration.showNotification(title, {
      body: body,
      icon: icon,
      badge: badge,
      tag: `girocleta-station-${station.id}`,
      renotify: true,
      data: { stationId: station.id, url: `./?station=${station.id}` },
      vibrate: [200, 100, 200]
    }).catch(err => {
      fallbackNotification(title, body, station.id);
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    fallbackNotification(title, body, station.id);
  }

  // 2. Also show in-app toast for visual confirmation
  showToast(`${title}\n${body}`);
}

function fallbackNotification(title, body, stationId) {
  try {
    const notif = new Notification(title, {
      body: body,
      icon: 'girocleta_logo.png',
      badge: 'girocleta-logo.svg',
      data: { stationId: stationId }
    });
    notif.onclick = () => {
      window.focus();
      selectStationById(stationId);
    };
  } catch (e) {
    console.warn('Fallback notification error', e);
  }
}

// Periodic Scheduled Notification Checker (Called every 30s)
function checkScheduledNotifications() {
  const prefs = state.preferences;
  if (!prefs || !prefs.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!state.stations || state.stations.length === 0) return;

  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  if (prefs.daysMode === 'weekdays' && (day === 0 || day === 6)) return;
  if (prefs.daysMode === 'weekends' && (day >= 1 && day <= 5)) return;

  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${mins}`;
  const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  const notifKey = `${todayKey}_${currentTime}`;

  if (prefs.lastNotifiedKey === notifKey) return;

  let shouldTrigger = false;
  if (prefs.scheduleMode === 'times') {
    if (prefs.scheduleTimes && prefs.scheduleTimes.includes(currentTime)) {
      shouldTrigger = true;
    }
  } else if (prefs.scheduleMode === 'interval') {
    const start = prefs.intervalStart || '07:30';
    const end = prefs.intervalEnd || '21:30';
    if (currentTime >= start && currentTime <= end) {
      const [startH, startM] = start.split(':').map(Number);
      const totalStartMins = startH * 60 + startM;
      const totalCurMins = now.getHours() * 60 + now.getMinutes();
      const diffMins = totalCurMins - totalStartMins;
      const step = parseInt(prefs.intervalOption, 10) || 30;
      if (diffMins >= 0 && diffMins % step === 0) {
        shouldTrigger = true;
      }
    }
  }

  if (!shouldTrigger) return;

  // Mark as triggered for this minute
  prefs.lastNotifiedKey = notifKey;
  savePreferences(false);

  // Identify Target Stations
  let targetStations = [];
  if (prefs.targetMode === 'favorites') {
    targetStations = state.stations.filter(s => state.favorites.has(s.id));
  } else if (prefs.targetMode === 'custom') {
    const idSet = new Set(prefs.customStationIds || []);
    targetStations = state.stations.filter(s => idSet.has(s.id));
  }

  if (targetStations.length === 0) return;

  // Optional Filtering conditions
  if (prefs.alertOnlyIfLowBikes || prefs.alertOnlyIfLowSlots) {
    targetStations = targetStations.filter(s => {
      let match = false;
      if (prefs.alertOnlyIfLowBikes && s.bikes <= (prefs.minBikesThreshold || 3)) match = true;
      if (prefs.alertOnlyIfLowSlots && s.slots <= (prefs.minSlotsThreshold || 3)) match = true;
      return match;
    });
  }

  // Dispatch notifications (max 3 at once to prevent spam)
  targetStations.slice(0, 3).forEach(station => {
    dispatchStationPushNotification(station, false);
  });
}

