// CONFIG
const supabaseUrl = 'https://jvsrjfdcmtvdolctvtpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3JqZmRjbXR2ZG9sY3R2dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjMwNzksImV4cCI6MjA4MTQzOTA3OX0.4jJUFTCTBbz21P9reUfE9sCBKM8Vl4ellExMVqozrdE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// STATE MANAGEMENT
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 6; // Saya naikkan sedikit agar tabel terlihat penuh tapi pas

// 1. AUTH CHECK
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) window.location.replace('login.html');
    else loadData();
}
checkAuth();

// 2. LOAD & INIT DATA
async function loadData() {
    // Tampilkan loading state sederhana di tabel jika perlu
    document.getElementById('tableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">Memuat Data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('data_sumur')
        .select('*')
        .order('id', { ascending: true });

    if (error) return console.error('Error:', error);

    allData = data;
    filteredData = data;

    updateDashboard();
}

// 3. MAIN RENDER FUNCTION 
function updateDashboard() {
    renderStats();
    renderCharts();
    renderTable();
    renderPagination();
}

// 4. RENDER STATS & CHARTS 
let chartInstance1 = null;
let chartInstance2 = null;

function renderStats() {
    const total = filteredData.length;
    const avgPh = total > 0 ? (filteredData.reduce((acc, cur) => acc + cur.Ph_air, 0) / total).toFixed(1) : 0;
    const riskCount = filteredData.filter(d => d["Jarak_ke_septic tank / limbah"] < 10).length;

    // Pastikan elemen ID ini ada di HTML Anda
    if (document.getElementById('totalData')) document.getElementById('totalData').innerText = total;
    if (document.getElementById('avgPh')) document.getElementById('avgPh').innerText = avgPh;
    if (document.getElementById('riskCount')) document.getElementById('riskCount').innerText = riskCount;
}

function renderCharts() {
    // A. Chart Jenis Sumur
    const borCount = filteredData.filter(d => d["Jenis_Sumber Air"].toLowerCase().includes('bor')).length;
    const galiCount = filteredData.filter(d => d["Jenis_Sumber Air"].toLowerCase().includes('gali')).length;

    // B. Chart Fisik (Distribusi 1-5)
    const counts = [0, 0, 0, 0, 0];
    filteredData.forEach(d => {
        let s = d["Skor_air_dari_rasa_warna_dan_bau"];
        if (s >= 1 && s <= 5) counts[s - 1]++;
    });

    // Chart 1: Jenis
    const ctx1 = document.getElementById('jenisChart').getContext('2d');
    if (chartInstance1) chartInstance1.destroy();
    chartInstance1 = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Sumur Bor', 'Sumur Gali'],
            datasets: [{
                data: [borCount, galiCount],
                backgroundColor: ['#3b82f6', '#eab308'],
                borderWidth: 0 // Menghilangkan border agar lebih clean
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Membuat donat lebih tipis (modern look)
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
        }
    });

    // Chart 2: Fisik
    const ctx2 = document.getElementById('fisikChart').getContext('2d');
    if (chartInstance2) chartInstance2.destroy();
    chartInstance2 = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['1 (Buruk)', '2', '3', '4', '5 (Bagus)'],
            datasets: [{
                label: 'Jumlah Titik',
                data: counts,
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'],
                borderRadius: 4, // Rounded corners pada bar
                barPercentage: 0.6 // Bar tidak terlalu gemuk
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: true, drawBorder: false, color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 5. RENDER TABLE WITH PAGINATION & ANIMATION
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = filteredData.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 40px; color: #94a3b8;">
                    <i class="ri-inbox-line" style="font-size: 24px; display:block; margin-bottom:10px;"></i>
                    Tidak ada data ditemukan
                </td>
            </tr>`;
        return;
    }

    paginatedItems.forEach((item, index) => {
        // Styling Badge yang lebih cantik
        const phBadge = (item.Ph_air >= 6.5 && item.Ph_air <= 8.5)
            ? '<span class="badge success"><i class="ri-check-line"></i> Netral</span>'
            : '<span class="badge warning"><i class="ri-alert-line"></i> Tidak Normal</span>';

        const septicBadge = (item["Jarak_ke_septic tank / limbah"] >= 10)
            ? '<span class="badge success"><i class="ri-shield-check-line"></i> Aman</span>'
            : '<span class="badge danger"><i class="ri-spam-3-line"></i> Bahaya</span>';

        const skor = item["Skor_air_dari_rasa_warna_dan_bau"];
        let fisikBadge = '';
        if (skor == 5) fisikBadge = `<span class="badge success">Sangat Bagus (5)</span>`;
        else if (skor == 4) fisikBadge = `<span class="badge success" style="background:#ecfccb; color:#4d7c0f; border-color:#d9f99d;">Bagus (4)</span>`;
        else if (skor == 3) fisikBadge = `<span class="badge warning">Cukup (3)</span>`;
        else if (skor == 2) fisikBadge = `<span class="badge danger" style="background:#fff7ed; color:#c2410c; border-color:#ffedd5;">Buruk (2)</span>`;
        else fisikBadge = `<span class="badge danger">Sangat Buruk (1)</span>`;

        // Teks Jenis Sumber Air
        const jenisColor = item["Jenis_Sumber Air"].toLowerCase().includes('bor') ? '#0ea5e9' : '#eab308';
        const jenisText = `<span style="color:${jenisColor}; font-weight:600;">${item["Jenis_Sumber Air"]}</span>`;

        // Row dengan animasi delay bertingkat
        const row = `
            <tr class="animate-row" style="animation-delay: ${index * 0.05}s">
                <td style="font-family:monospace; color:#64748b;">#${item.id}</td>
                <td>${jenisText}</td>
                <td>${item.Ph_air} ${phBadge}</td>
                <td><b>${item["Jarak_ke_septic tank / limbah"]}m</b> ${septicBadge}</td>
                <td>${fisikBadge}</td>
                <td style="text-align:right;">
                    <button class="action-btn btn-edit" onclick="editData(${item.id})" title="Edit"><i class="ri-pencil-line"></i></button>
                    <button class="action-btn btn-delete" onclick="deleteData(${item.id})" title="Hapus"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 6. PAGINATION CONTROLS
function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Update Info Halaman
    const startData = (filteredData.length === 0) ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endData = Math.min(currentPage * rowsPerPage, filteredData.length);
    document.getElementById('pageInfo').innerHTML = `Menampilkan <b>${startData}-${endData}</b> dari <b>${filteredData.length}</b> data`;

    // Update Button State
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Gunakan class .page-btn di HTML dashboard.html untuk tombol ini
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    // Reset opacity visually
    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    nextBtn.style.opacity = (currentPage === totalPages || totalPages === 0) ? '0.5' : '1';
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const nextPage = currentPage + direction;

    if (nextPage > 0 && nextPage <= totalPages) {
        currentPage = nextPage;
        updateDashboard(); // Render ulang
    }
}

// 7. SEARCH FUNCTION
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();

    filteredData = allData.filter(item => {
        return item.id.toString().includes(query) ||
            item["Jenis_Sumber Air"].toLowerCase().includes(query);
    });

    currentPage = 1;
    updateDashboard();
}

// 8. CRUD ACTIONS
const crudForm = document.getElementById('crudForm');
if (crudForm) {
    crudForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = crudForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Menyimpan...';
        submitBtn.disabled = true;

        const id = document.getElementById('dataId').value;
        const newData = {
            X: parseFloat(document.getElementById('lat').value),
            Y: parseFloat(document.getElementById('lng').value),
            "Jenis_Sumber Air": document.getElementById('jenis').value,
            Ph_air: parseFloat(document.getElementById('ph').value),
            "Jarak_ke_septic tank / limbah": parseInt(document.getElementById('jarak').value),
            "Skor_air_dari_rasa_warna_dan_bau": parseInt(document.getElementById('skor').value),
            Foto_sumber_air: document.getElementById('foto').value
        };

        let error;
        if (id) {
            const { error: err } = await supabaseClient.from('data_sumur').update(newData).eq('id', id);
            error = err;
        } else {
            const { error: err } = await supabaseClient.from('data_sumur').insert([newData]);
            error = err;
        }

        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (!error) {
            closeModal();
            loadData();
        } else {
            alert('Gagal: ' + error.message);
        }
    });
}

window.editData = async (id) => {
    const { data } = await supabaseClient.from('data_sumur').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('dataId').value = data.id;
        document.getElementById('lat').value = data.X;
        document.getElementById('lng').value = data.Y;
        document.getElementById('jenis').value = data["Jenis_Sumber Air"];
        document.getElementById('ph').value = data.Ph_air;
        document.getElementById('jarak').value = data["Jarak_ke_septic tank / limbah"];
        document.getElementById('skor').value = data["Skor_air_dari_rasa_warna_dan_bau"];
        document.getElementById('foto').value = data.Foto_sumber_air;
        openModal();
    }
};

window.deleteData = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini secara permanen?')) {
        await supabaseClient.from('data_sumur').delete().eq('id', id);
        loadData();
    }
};

window.logout = async () => {
    await supabaseClient.auth.signOut();
    window.location.replace('login.html');
};

// UI Helpers
window.openModal = () => document.getElementById('dataModal').classList.add('show');
window.closeModal = () => {
    document.getElementById('dataModal').classList.remove('show');
    document.getElementById('crudForm').reset();
    document.getElementById('dataId').value = '';
};