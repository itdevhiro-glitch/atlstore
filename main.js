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

let allProducts = [];

const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const createCardHTML = (key, data, isAdmin) => {
    let btns = '';
    
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
        
        let btnTokped = linkTokped !== '#' ? `<a href="${linkTokped}" target="_blank" class="btn btn-tokopedia btn-sm" style="text-align:center; display:block">Tokopedia</a>` : `<button class="btn btn-disabled btn-sm" style="width:100%">Tokopedia</button>`;
        let btnShopee = linkShopee !== '#' ? `<a href="${linkShopee}" target="_blank" class="btn btn-shopee btn-sm" style="text-align:center; display:block">Shopee</a>` : `<button class="btn btn-disabled btn-sm" style="width:100%">Shopee</button>`;

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

const renderCatalog = (products) => {
    const container = document.getElementById('full-catalog-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const countEl = document.getElementById('catalog-count');
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #64748B; padding: 3rem;">Tidak ada produk yang cocok dengan filter.</p>';
        if(countEl) countEl.innerText = '0 Produk';
        return;
    }

    if(countEl) countEl.innerText = `${products.length} Produk`;

    products.forEach(item => {
        container.innerHTML += createCardHTML(item.key, item.data, false);
    });
};

const filterProducts = () => {
    const search = document.getElementById('search-input').value.toLowerCase();
    const brand = document.getElementById('filter-brand').value;
    const priceRange = document.getElementById('filter-price').value;
    const ramChecks = Array.from(document.querySelectorAll('.filter-ram:checked')).map(c => c.value);
    const sort = document.getElementById('sort-price').value;

    let filtered = allProducts.filter(item => {
        const d = item.data;
        const matchSearch = d.model.toLowerCase().includes(search) || d.brand.toLowerCase().includes(search);
        const matchBrand = brand === 'all' || d.brand === brand;
        
        let matchPrice = true;
        const p = parseInt(d.price);
        if (priceRange === 'under-5') matchPrice = p < 5000000;
        else if (priceRange === '5-10') matchPrice = p >= 5000000 && p <= 10000000;
        else if (priceRange === '10-15') matchPrice = p > 10000000 && p <= 15000000;
        else if (priceRange === 'above-15') matchPrice = p > 15000000;

        let matchRam = true;
        if (ramChecks.length > 0) {
            matchRam = ramChecks.some(r => d.ram.includes(r));
        }

        return matchSearch && matchBrand && matchPrice && matchRam;
    });

    if (sort === 'low-high') filtered.sort((a, b) => a.data.price - b.data.price);
    else if (sort === 'high-low') filtered.sort((a, b) => b.data.price - a.data.price);
    else filtered.reverse(); 

    renderCatalog(filtered);
};

const setupFilters = () => {
    const inputs = ['search-input', 'filter-brand', 'filter-price', 'sort-price'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', filterProducts);
    });

    document.querySelectorAll('.filter-ram').forEach(el => el.addEventListener('change', filterProducts));
    
    const reset = document.getElementById('reset-filter');
    if(reset) {
        reset.addEventListener('click', () => {
            document.getElementById('search-input').value = '';
            document.getElementById('filter-brand').value = 'all';
            document.getElementById('filter-price').value = 'all';
            document.getElementById('sort-price').value = 'newest';
            document.querySelectorAll('.filter-ram').forEach(el => el.checked = false);
            filterProducts();
        });
    }
};

const renderRecommendations = (snapshot) => {
    const container = document.getElementById('recommendation-grid');
    if (!container) return;
    container.innerHTML = '';
    
    snapshot.forEach(child => {
        const data = child.val();
        if (data.isRecommended === 'true') {
            container.innerHTML += createCardHTML(child.key, data, false);
        }
    });
};

const renderDashboardStats = (productsSnap, financeSnap) => {
    const elTotalProd = document.getElementById('stat-total-products');
    const elAsset = document.getElementById('stat-asset-value');
    const elMonthTrx = document.getElementById('stat-monthly-trx');
    const recentTable = document.getElementById('dashboard-recent-trx');
    const topList = document.getElementById('top-product-list');

    if (!elTotalProd) return;

    let totalProd = 0;
    let totalAsset = 0;
    let expensiveProds = [];

    productsSnap.forEach(child => {
        const d = child.val();
        totalProd++;
        totalAsset += parseInt(d.price);
        expensiveProds.push({ name: `${d.brand} ${d.model}`, price: parseInt(d.price) });
    });

    expensiveProds.sort((a,b) => b.price - a.price);
    
    elTotalProd.innerText = totalProd;
    elAsset.innerText = formatRupiah(totalAsset);

    if (topList) {
        topList.innerHTML = '';
        expensiveProds.slice(0, 3).forEach(p => {
            topList.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:0.5rem;">
                    <span style="font-weight:600; font-size:0.9rem">${p.name}</span>
                    <span style="color:var(--primary); font-weight:700">${formatRupiah(p.price)}</span>
                </div>
            `;
        });
    }

    let thisMonthTrx = 0;
    const currentMonth = new Date().getMonth();
    const transactions = [];

    financeSnap.forEach(child => {
        const d = child.val();
        const tDate = new Date(d.date);
        if (tDate.getMonth() === currentMonth && d.type === 'in') {
            thisMonthTrx++;
        }
        transactions.push(d);
    });

    elMonthTrx.innerText = thisMonthTrx;

    if (recentTable) {
        recentTable.innerHTML = '';
        transactions.reverse().slice(0, 5).forEach(t => {
            recentTable.innerHTML += `
                <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.desc}</td>
                    <td style="font-weight:bold; color:${t.type === 'in' ? 'var(--success)' : 'var(--danger)'}">
                        ${t.type === 'in' ? '+' : '-'} ${formatRupiah(t.amount)}
                    </td>
                </tr>
            `;
        });
    }
};

const renderAdminProducts = (snapshot) => {
    const container = document.getElementById('admin-product-list');
    if(!container) return;
    container.innerHTML = '';
    snapshot.forEach(child => {
        container.innerHTML += createCardHTML(child.key, child.val(), true);
    });
};

const renderFinance = (snapshot) => {
    const tableBody = document.getElementById('finance-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    let totalIn = 0, totalOut = 0;
    snapshot.forEach((child) => {
        const data = child.val();
        if (data.type === 'in') totalIn += parseInt(data.amount);
        else totalOut += parseInt(data.amount);

        tableBody.innerHTML += `
            <tr>
                <td>${formatDate(data.date)}</td>
                <td>${data.category}</td>
                <td>${data.desc}</td>
                <td>${data.method}</td>
                <td>${data.type === 'in' ? '<span class="text-green">Masuk</span>' : '<span class="text-red">Keluar</span>'}</td>
                <td style="font-weight:bold">${formatRupiah(data.amount)}</td>
                <td><button class="btn-danger" onclick="hapusData('finance', '${child.key}')">X</button></td>
            </tr>
        `;
    });

    const elInc = document.getElementById('fin-income');
    const elExp = document.getElementById('fin-expense');
    const elBal = document.getElementById('fin-balance');
    
    if(elInc) elInc.innerText = formatRupiah(totalIn);
    if(elExp) elExp.innerText = formatRupiah(totalOut);
    if(elBal) elBal.innerText = formatRupiah(totalIn - totalOut);
};

const renderEmployees = (snapshot) => {
    const table = document.getElementById('employee-table-body');
    if(!table) return;
    table.innerHTML = '';
    snapshot.forEach(child => {
        const d = child.val();
        table.innerHTML += `
            <tr>
                <td style="font-weight:600">${d.name}</td>
                <td>${d.role}</td>
                <td>${d.phone}</td>
                <td>${formatRupiah(d.salary)}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="prosesGaji('${d.name}', ${d.salary})">Bayar</button>
                    <button class="btn btn-danger btn-sm" onclick="hapusData('employees', '${child.key}')">X</button>
                </td>
            </tr>
        `;
    });
};

if (document.getElementById('full-catalog-grid')) {
    onValue(productsRef, (snap) => {
        allProducts = [];
        snap.forEach(child => {
            allProducts.push({ key: child.key, data: child.val() });
        });
        filterProducts(); 
    });
    setupFilters();
}

if (document.getElementById('recommendation-grid')) {
    onValue(productsRef, renderRecommendations);
}

const dashboard = document.getElementById('dashboard-container');
if (dashboard) {
    onAuthStateChanged(auth, (user) => {
        const loginOverlay = document.getElementById('login-overlay');
        if (user) {
            loginOverlay.classList.add('hidden');
            dashboard.classList.remove('hidden');
            
            onValue(productsRef, (snap) => {
                renderAdminProducts(snap);
                onValue(financeRef, (finSnap) => {
                    renderDashboardStats(snap, finSnap);
                    renderFinance(finSnap);
                });
            });
            onValue(employeesRef, renderEmployees);
        } else {
            loginOverlay.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, 
            document.getElementById('admin-email').value, 
            document.getElementById('admin-pass').value
        ).catch(() => {
            document.getElementById('login-error').innerText = "Login Gagal!";
        });
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm("Keluar dari sistem?")) signOut(auth);
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
        }).then(() => { alert("Produk Tersimpan!"); productForm.reset(); });
    });
}

const financeForm = document.getElementById('finance-form');
if (financeForm) {
    financeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        push(financeRef, {
            category: document.getElementById('fin-category').value,
            method: "Manual",
            type: document.getElementById('fin-type').value,
            amount: document.getElementById('fin-amount').value,
            desc: document.getElementById('fin-desc').value,
            date: new Date().toISOString()
        }).then(() => { alert("Transaksi Tersimpan!"); financeForm.reset(); });
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
        }).then(() => { alert("Karyawan Tersimpan!"); empForm.reset(); });
    });
}

window.hapusData = (node, key) => {
    if (confirm("Hapus data ini?")) {
        remove(ref(db, `${node}/${key}`));
    }
};

window.prosesJual = (key, name, price) => {
    if(confirm(`Konfirmasi terjual: ${name}?`)) {
        push(financeRef, {
            category: "Penjualan Unit",
            method: "Cash",
            type: "in",
            amount: price,
            desc: `SOLD: ${name}`,
            date: new Date().toISOString()
        })
        .then(() => {
            remove(ref(db, `products/${key}`));
            alert("Terjual & Masuk Kas!");
            window.switchTab('overview-view');
        });
    }
};

window.prosesGaji = (name, salary) => {
    if(confirm(`Bayar gaji ${name}?`)) {
        push(financeRef, {
            category: "Gaji Karyawan",
            method: "Transfer",
            type: "out",
            amount: salary,
            desc: `Gaji: ${name}`,
            date: new Date().toISOString()
        }).then(() => alert("Gaji Dibayar!"));
    }
};

window.switchTab = (tabId) => {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none'; 
    });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
    
    if (event.currentTarget) event.currentTarget.classList.add('active');
    
    if (window.innerWidth < 1024) {
        document.querySelector('.sidebar').classList.remove('open');
    }
};
