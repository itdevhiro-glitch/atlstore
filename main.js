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

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const createCard = (key, data, isAdmin = false) => {
    const ramTags = data.ram.split(',').map(r => `<span class="tag">${r.trim()}</span>`).join('');
    const ssdTags = data.ssd.split(',').map(s => `<span class="tag">${s.trim()}</span>`).join('');

    let buttons = '';
    if (isAdmin) {
        buttons = `<button class="btn btn-danger btn-sm" onclick="deleteProduct('${key}')">Hapus Item</button>`;
    } else {
        buttons = `
            <div class="action-buttons">
                <a href="#" class="btn btn-sm btn-disabled">Tokopedia (Soon)</a>
                <a href="#" class="btn btn-sm btn-disabled">Shopee (Soon)</a>
            </div>
        `;
    }

    return `
        <div class="product-card" data-brand="${data.brand}">
            <img src="${data.image}" alt="${data.model}" class="product-image" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
            <div class="product-info">
                <span class="product-brand">${data.brand}</span>
                <h3 class="product-title">${data.model}</h3>
                <div class="product-specs">
                    <div class="spec-item">🧠 ${data.cpu}</div>
                    <div class="spec-item">🎮 ${data.gpu}</div>
                </div>
                <div class="tag-container">${ramTags}</div>
                <div class="tag-container">${ssdTags}</div>
                <div class="product-price">${formatRupiah(data.price)}</div>
                ${buttons}
            </div>
        </div>
    `;
};

const renderUser = (snapshot) => {
    const recGrid = document.getElementById('recommendation-grid');
    const catGrid = document.getElementById('catalog-grid');
    if(!recGrid || !catGrid) return;

    recGrid.innerHTML = ''; catGrid.innerHTML = '';

    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;
        const card = createCard(key, data, false);

        if (data.isRecommended === 'true') recGrid.innerHTML += card;
        catGrid.innerHTML += card;
    });
};

const renderAdmin = (snapshot) => {
    const listGrid = document.getElementById('admin-product-list');
    if(!listGrid) return;
    listGrid.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;
        listGrid.innerHTML += createCard(key, data, true);
    });
};

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        const errorMsg = document.getElementById('login-error');

        signInWithEmailAndPassword(auth, email, pass)
            .then(() => { errorMsg.innerText = ""; })
            .catch((error) => { errorMsg.innerText = "Login Gagal: " + error.message; });
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.reload());
    });
}

onAuthStateChanged(auth, (user) => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('dashboard-container');
    
    if (loginOverlay && dashboard) {
        if (user) {
            loginOverlay.classList.add('hidden');
            dashboard.classList.remove('hidden');
            onValue(productsRef, (snapshot) => renderAdmin(snapshot));
        } else {
            loginOverlay.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    } else {
        onValue(productsRef, (snapshot) => renderUser(snapshot));
    }
});

const form = document.getElementById('product-form');
if (form) {
    form.addEventListener('submit', (e) => {
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
                alert('Data berhasil disimpan!');
                form.reset();
            })
            .catch((error) => alert('Error: Pastikan Anda Login sebagai Admin!'));
    });
}

const brandFilter = document.getElementById('brand-filter');
if (brandFilter) {
    brandFilter.addEventListener('change', (e) => {
        const selected = e.target.value;
        const cards = document.querySelectorAll('#catalog-grid .product-card');
        cards.forEach(card => {
            if (selected === 'all' || card.dataset.brand === selected) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

window.deleteProduct = (key) => {
    if(confirm('Yakin ingin menghapus produk ini?')) {
        remove(ref(db, `products/${key}`))
        .catch(err => alert("Gagal menghapus: Akses Ditolak"));
    }
};