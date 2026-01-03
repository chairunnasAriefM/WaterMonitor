// --- 1. SETUP (Ganti nama variabel jadi supabaseClient) ---
const supabaseUrl = 'https://jvsrjfdcmtvdolctvtpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3JqZmRjbXR2ZG9sY3R2dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjMwNzksImV4cCI6MjA4MTQzOTA3OX0.4jJUFTCTBbz21P9reUfE9sCBKM8Vl4ellExMVqozrdE';

// PENTING: Gunakan nama 'supabaseClient' agar tidak bentrok dengan library bawaan
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. CEK STATUS LOGIN (Redirect jika sudah login) ---
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    // Jika ada session (sudah login), langsung lempar ke dashboard
    if (session) {
        window.location.replace('dashboard.html');
    }
}
checkSession();

// --- 3. HANDLE FORM LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.querySelector('button');
        const errorMsg = document.getElementById('errorMsg');

        // UI Loading
        btn.textContent = 'Memproses...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        // Proses Login
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Jika Gagal
            errorMsg.textContent = "Login Gagal: " + error.message;
            errorMsg.style.display = 'block';
            btn.textContent = 'Masuk Dashboard';
            btn.disabled = false;
        } else {
            // Jika Berhasil -> Pindah ke Dashboard
            window.location.replace('dashboard.html');
        }
    });
}