// --- 0. SETUP SUPABASE ---
const supabaseUrl = 'https://jvsrjfdcmtvdolctvtpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3JqZmRjbXR2ZG9sY3R2dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjMwNzksImV4cCI6MjA4MTQzOTA3OX0.4jJUFTCTBbz21P9reUfE9sCBKM8Vl4ellExMVqozrdE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 1. SETUP MAP ---
var normalMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });
var darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' });
var satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' });

var map = L.map('map', {
    center: [0.52, 101.45],
    zoom: 12,
    zoomControl: false, 
    layers: [normalMap]
});

L.control.zoom({ position: 'bottomleft' }).addTo(map);

// --- 2. LAYER GROUPS ---
var layers = {
    kecamatan: null,           // Akan diisi GeoJSON
    water: new L.LayerGroup().addTo(map), // DEFAULT ON (Titik Utama)
    septic: new L.LayerGroup(),
    fisik: new L.LayerGroup(),
    ph: new L.LayerGroup(),
    jenis: new L.LayerGroup()
};

// --- 3. DEFINISI ICON CUSTOM (DIKEMBALIKAN) ---
var waterIcon = L.icon({
    iconUrl: 'assets/img/iconAir.png', // Pastikan path ini benar sesuai folder kamu
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

// --- 4. UI LOGIC (MENU & TOGGLE) ---
function switchBaseMap(type, element) {
    map.removeLayer(normalMap); map.removeLayer(darkMap); map.removeLayer(satelliteMap);
    if (type === 'normal') map.addLayer(normalMap);
    else if (type === 'dark') map.addLayer(darkMap);
    else if (type === 'satellite') map.addLayer(satelliteMap);
    
    document.querySelectorAll('.style-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function toggleLayer(name, checkbox) {
    if (!layers[name]) return;
    if (checkbox.checked) map.addLayer(layers[name]);
    else map.removeLayer(layers[name]);
}

function toggleMenuVisible() {
    const menu = document.getElementById('mainMenu');
    menu.classList.toggle('hidden');
}

// --- 5. FETCH DATA KECAMATAN ---
fetch('assets/data/kecamatan_pekanbaru.geojson')
    .then(res => res.json())
    .then(data => {
        layers.kecamatan = L.geoJSON(data, {
            filter: function (f) { return f.geometry.type.includes("Polygon"); },
            style: function (f) {
                // Algoritma warna acak (Saya pisahkan logicnya biar bisa dipakai di popup juga)
                let hash = 0;
                let str = f.properties.name || "";
                for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
                let color = '#' + ('00000' + (hash & 0xFFFFFF).toString(16)).slice(-6);
                
                // Simpan warna di properti feature agar bisa diakses oleh popup
                f.properties.generatedColor = color; 

                return { 
                    fillColor: color, 
                    weight: 2, 
                    color: "white", 
                    dashArray: '3', 
                    fillOpacity: 0.2 
                };
            },
            onEachFeature: (f, layer) => {
                // Ambil warna yang sudah digenerate di style tadi
                let headerColor = f.properties.generatedColor || '#333';
                let namaKecamatan = f.properties.name || 'Tanpa Nama';

                // HTML Popup Premium (Menggunakan CSS .popup-card yang sudah ada)
                let customPopup = `
                    <div class="popup-card">
                        <div class="popup-hero" style="
                            background-color: ${headerColor}; 
                            background-image: none; 
                            height: 80px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="ri-map-pin-range-line" style="font-size: 40px; color: rgba(255,255,255,0.3);"></i>
                            <div class="popup-badge" style="background: rgba(0,0,0,0.2); backdrop-filter: blur(5px);">
                                ZONA WILAYAH
                            </div>
                        </div>

                        <div class="popup-details">
                            <div style="text-align:center; margin-bottom:10px;">
                                <h3 style="margin:0; color:#1e293b; font-size:16px;">${namaKecamatan.toUpperCase()}</h3>
                                <small style="color:#64748b;">Kota Pekanbaru</small>
                            </div>
                            
                            <div class="popup-row">
                                <span>Tipe Admin</span>
                                <b>Kecamatan</b>
                            </div>
                        </div>
                        
                        <div class="popup-footer">
                            Klik area lain untuk menutup
                        </div>
                    </div>
                `;

                layer.bindPopup(customPopup);
            }
        });
        
        // Nyalakan layer kecamatan secara default
        map.addLayer(layers.kecamatan);
    })
    .catch(e => console.error("Error GeoJSON:", e));


// --- 6. HELPER FUNCTIONS ---
function fixGoogleDriveLink(url) {
    if (!url || url.trim() === '') return 'https://placehold.co/300x150?text=No+Data';
    var idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    var slashMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    var fileId = (idMatch && idMatch[1]) ? idMatch[1] : ((slashMatch && slashMatch[1]) ? slashMatch[1] : null);
    if (fileId) return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
    return url;
}

function createPopupContent(data, badgeColor, badgeText, additionalInfo) {
    var imgUrl = fixGoogleDriveLink(data.Foto_sumber_air);
    return `
        <div class="popup-card">
            <div class="popup-hero" style="background-image: url('${imgUrl}');">
                <div class="popup-badge" style="background:${badgeColor}">${badgeText}</div>
            </div>
            <div class="popup-details">
                <div class="popup-row">
                    <span>ID Sumur</span>
                    <b>#${data.id}</b>
                </div>
                <div class="popup-row">
                    <span>Jenis</span>
                    <b>${data["Jenis_Sumber Air"] || '-'}</b>
                </div>
                ${additionalInfo}
            </div>
            <div class="popup-footer">
                Tap sembarang untuk tutup
            </div>
        </div>
    `;
}

// --- 7. LOAD DATA SUPABASE ---
async function loadSupabaseData() {
    const { data, error } = await supabaseClient.from('data_sumur').select('*');
    if (error || !data) return console.error("Err:", error);

    data.forEach(item => {
        var lat = item.X; var lng = item.Y;
        if (!lat || !lng) return;

        // 1. LAYER UTAMA (Icon Custom + Popup Bagus)
        var popupWater = createPopupContent(item, '#3b82f6', 'SUMBER AIR', `
            <div class="popup-row"><span>Kondisi</span> <b>Umum</b></div>
        `);
        
        // Menggunakan waterIcon yang sudah didefinisikan di atas
        L.marker([lat, lng], {icon: waterIcon})
         .bindPopup(popupWater)
         .addTo(layers.water);

        // 2. LAYER SEPTIC TANK
        var jarak = item["Jarak_ke_septic tank / limbah"];
        var colorS = jarak < 10 ? '#ef4444' : '#22c55e';
        var statusS = jarak < 10 ? 'BAHAYA' : 'AMAN';
        var mSeptic = L.circleMarker([lat, lng], { radius: 8, fillColor: colorS, color: '#fff', weight: 2, fillOpacity: 0.8 })
            .bindPopup(createPopupContent(item, colorS, statusS, `
                <div class="popup-row"><span>Jarak Septic</span> <b style="color:${colorS}">${jarak} m</b></div>
                <div class="popup-row"><span>Status SNI</span> <b>${statusS}</b></div>
            `));
        layers.septic.addLayer(mSeptic);

// 3. LAYER FISIK (Updated: Skala 1-5)
        var skor = parseInt(item["Skor_air_dari_rasa_warna_dan_bau"]) || 0;
        var colorF, statusF;

        // Tentukan Warna & Status berdasarkan Skor (5 Terbaik - 1 Terburuk)
        if (skor >= 5) {
            colorF = '#22c55e'; // Hijau Tua (Sangat Bagus)
            statusF = 'SANGAT BAGUS';
        } else if (skor == 4) {
            colorF = '#84cc16'; // Hijau Muda (Bagus)
            statusF = 'BAGUS';
        } else if (skor == 3) {
            colorF = '#eab308'; // Kuning (Cukup)
            statusF = 'CUKUP';
        } else if (skor == 2) {
            colorF = '#f97316'; // Orange (Buruk)
            statusF = 'BURUK';
        } else {
            colorF = '#ef4444'; // Merah (Sangat Buruk / Skor 1)
            statusF = 'SANGAT BURUK';
        }

        var mFisik = L.circleMarker([lat, lng], { 
            radius: 8, 
            fillColor: colorF, 
            color: '#fff', 
            weight: 2, 
            fillOpacity: 0.9 
        })
        .bindPopup(createPopupContent(item, colorF, statusF, `
            <div class="popup-row"><span>Skor Fisik</span> <b>${skor} / 5</b></div>
            <div class="popup-row"><span>Kondisi</span> <b style="color:${colorF}">${statusF}</b></div>
        `));
        
        layers.fisik.addLayer(mFisik);

        // 4. LAYER PH
        var ph = item.Ph_air;
        var colorP = ph < 6.5 ? '#ef4444' : (ph > 8.5 ? '#9333ea' : '#22c55e');
        var statusP = ph < 6.5 ? 'ASAM' : (ph > 8.5 ? 'BASA' : 'NETRAL');
        var mPh = L.circleMarker([lat, lng], { radius: 8, fillColor: colorP, color: '#fff', weight: 2, fillOpacity: 0.8 })
            .bindPopup(createPopupContent(item, colorP, statusP, `
                <div class="popup-row"><span>pH Air</span> <b>${ph}</b></div>
                <div class="popup-row"><span>Sifat</span> <b>${statusP}</b></div>
            `));
        layers.ph.addLayer(mPh);

        // 5. LAYER JENIS
        var jenis = item["Jenis_Sumber Air"] || "";
        var colorJ = jenis.toLowerCase().includes('bor') ? '#1e40af' : '#eab308';
        var mJenis = L.circleMarker([lat, lng], { radius: 8, fillColor: colorJ, color: '#fff', weight: 2, fillOpacity: 0.8 })
            .bindPopup(createPopupContent(item, colorJ, jenis.toUpperCase(), `
                 <div class="popup-row"><span>Tipe Sumur</span> <b>${jenis}</b></div>
            `));
        layers.jenis.addLayer(mJenis);
    });
}

loadSupabaseData();