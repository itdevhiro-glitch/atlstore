import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
    apiKey: "AIzaSyBMA1rA90qC8KLE7spe83rHCKCUXqEqlYU",
    authDomain: "atlantis-store-b1952.firebaseapp.com",
    databaseURL: "https://atlantis-store-b1952-default-rtdb.firebaseio.com",
    projectId: "atlantis-store-b1952",
    storageBucket: "atlantis-store-b1952.firebasestorage.app",
    messagingSenderId: "919212230206",
    appId: "1:919212230206:web:3abf6dc0b2af092516f36f",
    measurementId: "G-K7EP7DKDYG"
};

// INITIALIZE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const productsRef = ref(db, 'products');

// FORMATTER RUPIAH
const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

// PEMBUAT KARTU HTML (Card Generator)
const createCardHTML = (key, data, isAdmin) => {
    let actionButtons = '';
    
    if (isAdmin) {
        actionButtons = `<button class="btn-danger" onclick="hapusProduk('${key}')">Hapus</button>`;
    } else {
        actionButtons = `
            <a href="#" class="btn btn-disabled btn-sm" style="text-align:center">Tokopedia</a>
            <a href="#" class="btn btn-disabled btn-sm" style="text-align:center">Shopee</a>
        `;
    }

    return `
        <div class="card" data-brand="${data.brand}">
            <img src="${data.image}" class="card-img" alt="${data.model}" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
            <div class="card-body">
                <span class="card-brand">${data.brand}</span>
                <h3 class="card-title">${data.model}</h3>
                <div class="card-specs">
                    <div>🧠 ${data.cpu}</div>
                    <div>🎮 ${data.gpu}</div>
                    <div style="margin-top:0.5rem">
                        <span class="tag">${data.ram}</span>
                        <span class="tag">${data.ssd}</span>
                    </div>
                </div>
                <div class="card-price">${formatRupiah(data.price)}</div>
                <div class="card-actions">${actionButtons}</div>
            </div>
        </div>
    `;
};

// RENDER KE LAYAR
const renderData = (snapshot, isAdmin = false) => {
    // Tentukan target elemen berdasarkan halaman (Admin / User)
    const recContainer = document.getElementById('recommendation-grid');
    const catContainer = document.getElementById('catalog-grid');
    const adminContainer = document.getElementById('admin-product-list');

    if (recContainer) recContainer.innerHTML = '';
    if (catContainer) catContainer.innerHTML = '';
    if (adminContainer) adminContainer.innerHTML = '';

    if (!snapshot.exists()) return;

    snapshot.forEach((child) => {
        const data = child.val();
        const key = child.key;
        const cardHTML = createCardHTML(key, data, isAdmin);

        // Jika di halaman Admin
        if (isAdmin && adminContainer) {
            adminContainer.innerHTML += cardHTML;
        } 
        // Jika di halaman User
        else if (!isAdmin) {
            if (catContainer) catContainer.innerHTML += cardHTML;
            if (recContainer && data.isRecommended === 'true') {
                recContainer.innerHTML += cardHTML;
            }
        }
    });
};

// LISTENER DATABASE
onAuthStateChanged(auth, (user) => {
    // Cek kita ada di halaman mana
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('dashboard-container');

    if (user) {
        // User Login (Admin Mode)
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        
        // Ambil data untuk Admin
        onValue(productsRef, (snapshot) => renderData(snapshot, true));
    } else {
        // User Logout / Public Mode
        if (loginOverlay) loginOverlay.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');

        // Ambil data untuk Public (Halaman Index)
        onValue(productsRef, (snapshot) => renderData(snapshot, false));
    }
});

// LOGIN FUNCTION
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        const errTxt = document.getElementById('login-error');

        signInWithEmailAndPassword(auth, email, pass)
            .then(() => {
                errTxt.innerText = "";
            })
            .catch((error) => {
                errTxt.innerText = "Login Gagal: Periksa Email/Password.";
            });
    });
}

// LOGOUT FUNCTION
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm("Keluar dari Admin?")) signOut(auth);
    });
}

// INPUT DATA FUNCTION
const productForm = document.getElementById('product-form');
if (productForm) {
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProduct = {
            brand: document.getElementById('brand').value,
            model: document.getElementById('model').value,
            cpu: document.getElementById('cpu').value,
            gpu: document.getElementById('gpu').value,
            ram: document.getElementById('ram').value,
            ssd: document.getElementById('ssd').value,
            price: document.getElementById('price').value,
            image: document.getElementById('image').value,
            isRecommended: document.getElementById('isRecommended').value
        };

        push(productsRef, newProduct)
            .then(() => {
                alert("Data berhasil disimpan!");
                productForm.reset();
            })
            .catch((err) => alert("Gagal menyimpan: " + err.message));
    });
}

// FILTER FUNCTION
const filterSelect = document.getElementById('brand-filter');
if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
        const filter = e.target.value;
        const cards = document.querySelectorAll('#catalog-grid .card');
        
        cards.forEach(card => {
            if (filter === 'all' || card.dataset.brand === filter) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// HAPUS DATA FUNCTION (Global Scope)
window.hapusProduk = (key) => {
    if (confirm("Hapus produk ini permanen?")) {
        remove(ref(db, `products/${key}`))
            .catch(err => alert("Gagal menghapus (Akses Ditolak)"));
    }
};
