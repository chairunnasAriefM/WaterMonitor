// --- 1. SETUP SUPABASE ---
const supabaseUrl = 'https://jvsrjfdcmtvdolctvtpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3JqZmRjbXR2ZG9sY3R2dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjMwNzksImV4cCI6MjA4MTQzOTA3OX0.4jJUFTCTBbz21P9reUfE9sCBKM8Vl4ellExMVqozrdE';

// PERBAIKAN: Ganti nama variabel jadi 'supabaseClient' agar tidak bentrok
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function() {
    
    // --- FUNGSI HITUNG DATA REAL ---
    async function fetchRealStats() {
        // PERBAIKAN: Gunakan 'supabaseClient' di sini
        const { count, error } = await supabaseClient
            .from('data_sumur')
            .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
            // Update elemen HTML
            const sumurEl = document.getElementById('total-sumur');
            // Cek apakah elemen ada sebelum diupdate (untuk menghindari error di page lain)
            if(sumurEl) {
                sumurEl.setAttribute('data-target', count);
                sumurEl.innerText = count; 
            }
        } else {
            console.error("Gagal mengambil data:", error);
        }

        // Jalankan animasi setelah data didapat
        runCounterAnimation(); 
    }

    // Panggil Fungsi Fetch
    await fetchRealStats();

    // --- LOGIKA MENU MOBILE ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if(hamburger && navLinks) { // Cek null safety
        const icon = hamburger.querySelector('i');
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if(navLinks.classList.contains('active')) {
                icon.classList.remove('ri-menu-4-line');
                icon.classList.add('ri-close-line');
            } else {
                icon.classList.remove('ri-close-line');
                icon.classList.add('ri-menu-4-line');
            }
        });
    }

    // --- LOGIKA SCROLL ANIMATION ---
    // (Kode animasi scroll dan counter tetap sama seperti sebelumnya...)
    
    // Kode Counter Animation (Saya sertakan ulang biar lengkap)
    function runCounterAnimation() {
        const statsSection = document.getElementById('stats');
        let hasCounted = false;

        if(!statsSection) return;

        const statsObserver = new IntersectionObserver((entries) => {
            if(entries[0].isIntersecting && !hasCounted) {
                const counters = document.querySelectorAll('.counter');
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const speed = 200; 
                    
                    const updateCount = () => {
                        const count = +counter.innerText;
                        // Handle jika target 0 atau data belum masuk
                        if (target === 0) return; 

                        const inc = target / speed;

                        if(count < target) {
                            counter.innerText = Math.ceil(count + inc);
                            setTimeout(updateCount, 20);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                });
                hasCounted = true;
            }
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    }
});