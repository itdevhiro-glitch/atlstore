import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const productsRef = ref(db, 'products');
const financeRef = ref(db, 'finance');
const employeesRef = ref(db, 'employees');

const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const createCardHTML = (key, data, isAdmin) => {
    let btns = '';
    
    // Logic tampilan tombol: Hanya tampil tombol admin jika mode Admin AKTIF
    if (isAdmin) {
        btns = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
                <button class="btn btn-success btn-sm" onclick="prosesJual('${key}', '${data.brand} ${data.model}', ${data.price})">✅ Terjual</button>
                <button class="btn btn-danger btn-sm" onclick="hapusData('products', '${key}')">Hapus</button>
            </div>
        `;
    } else {
        const linkTokped = data.linkTokopedia || '#';
        const linkShopee = data.linkShopee || '#';
        
        let btnTokped = linkTokped !== '#' ? `<a href="${linkTokped}" target="_blank" class="btn btn-tokopedia btn-sm" style="text-align:center; display:block">Tokopedia</a>` : `<button class="btn btn-disabled btn-sm" style="background:#ddd; color:#999; width:100%">Tokopedia</button>`;
        let btnShopee = linkShopee !== '#' ? `<a href="${linkShopee}" target="_blank" class="btn btn-shopee btn-sm" style="text-align:center; display:block">Shopee</a>` : `<button class="btn btn-disabled btn-sm" style="background:#ddd; color:#999; width:100%">Shopee</button>`;

        btns = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
                ${btnTokped}
                ${btnShopee}
            </div>
        `;
    }

    return `
        <div class="card" data-brand="${data.brand}">
            <img src="${data.image}" class="card-img" alt="${data.model}" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
            <div class="card-body">
                <span class="card-brand">${data.brand}</span>
                <h3 class="card-title">${data.model}</h3>
                <div class="card-specs">
                    <span class="spec-tag">🧠 ${data.cpu}</span>
                    <span class="spec-tag">🎮 ${data.gpu}</span>
                    <span class="spec-tag">💾 ${data.ram} / ${data.ssd}</span>
                </div>
                <div class="card-price">${formatRupiah(data.price)}</div>
                <div style="margin-top:0.5rem">${btns}</div>
            </div>
        </div>
    `;
};

const renderProducts = (snapshot, isAdmin = false) => {
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
        const html = createCardHTML(key, data, isAdmin);

        // Jika mode Admin, masukkan ke container Admin
        if (isAdmin && adminContainer) {
            adminContainer.innerHTML += html;
        } 
        // Jika mode User (atau Admin buka index.html), masukkan ke container User
        else if (!isAdmin) {
            if (catContainer) catContainer.innerHTML += html;
            if (recContainer && data.isRecommended === 'true') {
                recContainer.innerHTML += html;
            }
        }
    });
};

const renderFinance = (snapshot) => {
    const tableBody = document.getElementById('finance-table-body');
    const elIncome = document.getElementById('fin-income');
    const elExpense = document.getElementById('fin-expense');
    const elBalance = document.getElementById('fin-balance');

    if (!tableBody) return;

    tableBody.innerHTML = '';
    let totalIn = 0;
    let totalOut = 0;

    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const data = child.val();
            const key = child.key;
            
            if (data.type === 'in') totalIn += parseInt(data.amount);
            else totalOut += parseInt(data.amount);

            const typeLabel = data.type === 'in' 
                ? '<span class="spec-tag" style="color:var(--success); background:#DCFCE7;">Pemasukan</span>' 
                : '<span class="spec-tag" style="color:var(--danger); background:#FEE2E2;">Pengeluaran</span>';

            tableBody.innerHTML += `
                <tr>
                    <td>${formatDate(data.date)}</td>
                    <td><span style="font-weight:600">${data.category}</span></td>
                    <td>${data.desc}</td>
                    <td><span class="spec-tag">${data.method}</span></td>
                    <td>${typeLabel}</td>
                    <td style="font-weight:bold">${formatRupiah(data.amount)}</td>
                    <td><button class="btn-danger" onclick="hapusData('finance', '${key}')">X</button></td>
                </tr>
            `;
        });
    }

    elIncome.innerText = formatRupiah(totalIn);
    elExpense.innerText = formatRupiah(totalOut);
    elBalance.innerText = formatRupiah(totalIn - totalOut);
};

const renderEmployees = (snapshot) => {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const data = child.val();
            const key = child.key;
            
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight:600">${data.name}</td>
                    <td>${data.role}</td>
                    <td>${data.phone}</td>
                    <td>${formatRupiah(data.salary)}</td>
                    <td>
                        <div style="display:flex; gap:0.5rem">
                            <button class="btn btn-success btn-sm" onclick="prosesGaji('${data.name}', ${data.salary})">💸 Bayar</button>
                            <button class="btn btn-danger btn-sm" onclick="hapusData('employees', '${key}')">Pecat</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
};

// --- FIX LOGIKA LOGIN: CEK HALAMAN MANA KITA BERADA ---
onAuthStateChanged(auth, (user) => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('dashboard-container');
    
    // Cek apakah kita di halaman admin (admin.html punya elemen dashboard-container)
    const isAdminPage = !!dashboard; 

    if (user && isAdminPage) {
        // LOGIN & DI HALAMAN ADMIN -> TAMPIL DASHBOARD
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        
        onValue(productsRef, (snap) => renderProducts(snap, true));
        onValue(financeRef, renderFinance);
        onValue(employeesRef, renderEmployees);
    } else {
        // TIDAK LOGIN ATAU DI HALAMAN USER (index.html) -> TAMPIL CATALOG
        if (loginOverlay) loginOverlay.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
        
        // PENTING: isAdmin diset FALSE agar dirender ke catalog-grid
        onValue(productsRef, (snap) => renderProducts(snap, false));
    }
});

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, 
            document.getElementById('admin-email').value, 
            document.getElementById('admin-pass').value
        ).catch(() => document.getElementById('login-error').innerText = "Login Gagal.");
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm("Keluar dari Admin?")) signOut(auth);
    });
}

const productForm = document.getElementById('product-form');
if (productForm) {
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        push(productsRef, {
            brand: document.getElementById('prod-brand').value,
            model: document.getElementById('prod-model').value,
            cpu: document.getElementById('prod-cpu').value,
            gpu: document.getElementById('prod-gpu').value,
            ram: document.getElementById('prod-ram').value,
            ssd: document.getElementById('prod-ssd').value,
            price: document.getElementById('prod-price').value,
            image: document.getElementById('prod-image').value,
            linkTokopedia: document.getElementById('prod-tokopedia').value,
            linkShopee: document.getElementById('prod-shopee').value,
            isRecommended: document.getElementById('prod-isRec').value
        }).then(() => { alert("Produk Disimpan!"); productForm.reset(); });
    });
}

const financeForm = document.getElementById('finance-form');
if (financeForm) {
    financeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        push(financeRef, {
            category: document.getElementById('fin-category').value,
            method: document.getElementById('fin-method').value,
            type: document.getElementById('fin-type').value,
            amount: document.getElementById('fin-amount').value,
            desc: document.getElementById('fin-desc').value,
            date: new Date().toISOString()
        }).then(() => { alert("Transaksi Dicatat!"); financeForm.reset(); });
    });
}

const empForm = document.getElementById('employee-form');
if (empForm) {
    empForm.addEventListener('submit', (e) => {
        e.preventDefault();
        push(employeesRef, {
            name: document.getElementById('emp-name').value,
            role: document.getElementById('emp-role').value,
            phone: document.getElementById('emp-phone').value,
            salary: document.getElementById('emp-salary').value
        }).then(() => { alert("Karyawan Ditambahkan!"); empForm.reset(); });
    });
}

const filterSelect = document.getElementById('brand-filter');
if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
        const filter = e.target.value;
        document.querySelectorAll('#catalog-grid .card').forEach(card => {
            card.style.display = (filter === 'all' || card.dataset.brand === filter) ? 'flex' : 'none';
        });
    });
}

window.hapusData = (node, key) => {
    if (confirm("Hapus data ini permanen?")) {
        remove(ref(db, `${node}/${key}`)).catch(err => alert("Gagal hapus"));
    }
};

window.prosesJual = (key, name, price) => {
    if(confirm(`Konfirmasi Penjualan: ${name} seharga ${formatRupiah(price)}?\n\nOtomatis masuk ke Pemasukan & Hapus dari stok.`)) {
        push(financeRef, {
            category: "Penjualan Unit",
            method: "Cash / Tunai", 
            type: "in",
            amount: price,
            desc: `SOLD OUT: ${name}`,
            date: new Date().toISOString()
        })
        .then(() => {
            remove(ref(db, `products/${key}`));
            alert("Berhasil! Uang masuk & Stok berkurang.");
            window.switchTab('finance-view');
        })
        .catch(err => alert("Error: " + err.message));
    }
};

window.prosesGaji = (name, salary) => {
    if(confirm(`Bayar gaji untuk ${name} sebesar ${formatRupiah(salary)}?\n\nOtomatis masuk ke Pengeluaran.`)) {
        push(financeRef, {
            category: "Gaji Karyawan",
            method: "Transfer BCA",
            type: "out",
            amount: salary,
            desc: `Gaji Bulanan: ${name}`,
            date: new Date().toISOString()
        })
        .then(() => {
            alert("Gaji berhasil dicatat di pengeluaran!");
            window.switchTab('finance-view');
        });
    }
};

window.switchTab = (tabId) => {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none'; 
    });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    if (window.event && window.event.target) {
        const clickedBtn = window.event.target.closest('.nav-item');
        if (clickedBtn) clickedBtn.classList.add('active');
    }

    if (window.innerWidth < 1024) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('open');
    }
};
