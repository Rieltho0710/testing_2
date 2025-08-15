// app.js - logika aplikasi: auth, UI, Firestore, charts

// Toggle menu mobile
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }
});


// Toggle Dropdown User Menu (desktop)
const userButton = document.getElementById('user-button');
const dropdownMenu = document.getElementById('dropdown-menu');

if (userButton && dropdownMenu) {
  userButton.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden');
  });
}

// Firebase Auth Integration
firebase.auth().onAuthStateChanged(user => {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const mobileAuth = document.getElementById('mobile-auth');
  const mobileUser = document.getElementById('mobile-user');

  if (user) {
    // Tampilkan username
    document.getElementById('username').textContent = user.displayName || "Pengguna";

    // Desktop
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');

    // Mobile
    mobileAuth.classList.add('hidden');
    mobileUser.classList.remove('hidden');
  } else {
    // Desktop
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');

    // Mobile
    mobileAuth.classList.remove('hidden');
    mobileUser.classList.add('hidden');
  }
});

function logout() {
  firebase.auth().signOut();
}


// ---------- Auth: Login / Register / Logout ----------
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    hideModal('login');
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const kelas = document.getElementById('register-class').value;
  const password = document.getElementById('register-password').value;
  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    // save additional profile to Firestore
    await db.collection('users').doc(userCred.user.uid).set({
      name, email, kelas, role: 'member', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    hideModal('register');
  } catch (err) {
    alert(err.message);
  }
});

async function logout() {
  await auth.signOut();
}

// ---------- Auth state handling ----------
auth.onAuthStateChanged(async (user) => {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const dashboard = document.getElementById('dashboard');
  const adminDashboard = document.getElementById('admin-dashboard');

  if (user) {
    // show user menu / hide auth buttons
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    document.getElementById('username').innerText = user.email.split('@')[0];

    // load user profile to determine role
    const doc = await db.collection('users').doc(user.uid).get();
    const profile = doc.exists ? doc.data() : null;
    const role = profile?.role || 'member';

    if (role === 'admin') {
      if (adminDashboard) adminDashboard.classList.remove('hidden');
      if (dashboard) dashboard.classList.add('hidden');
    } else {
      if (dashboard) dashboard.classList.remove('hidden');
      if (adminDashboard) adminDashboard.classList.add('hidden');
      document.getElementById('dashboard-username').innerText = profile?.name || user.email;
    }
  } else {
    // not logged in
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (dashboard) dashboard.classList.add('hidden');
    if (adminDashboard) adminDashboard.classList.add('hidden');
  }
});

// ---------- Load books from Firestore and render ----------
let allBooks = [];
function renderBooks(list) {
  const container = document.getElementById('book-list');
  if (!container) return;
  container.innerHTML = '';
  list.forEach(b => {
    const el = document.createElement('div');
    el.className = 'bg-white rounded-lg shadow-md overflow-hidden book-card transition duration-300';
    el.innerHTML = `
      <div class="blur-load">
        <img src="${b.image || 'images/book-placeholder.png'}" alt="${escapeHtml(b.title)}" loading="lazy" class="w-full h-64 object-cover">
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg mb-1">${escapeHtml(b.title)}</h3>
        <p class="text-gray-600 text-sm mb-2">${escapeHtml(b.author || '')}</p>
        <div class="flex items-center mb-2">
          <div class="flex text-yellow-400">★★★★☆</div>
          <span class="text-gray-500 text-sm ml-2">(${b.reviews || 0})</span>
        </div>
        <p class="text-sm text-gray-700 mb-3 line-clamp-2">${escapeHtml(b.description || '')}</p>
        <div class="flex justify-between items-center">
          <span class="text-green-600 text-sm font-medium">${b.stock > 0 ? 'Tersedia ('+b.stock+')' : 'Habis'}</span>
          <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition" onclick="openBookDetail('${b.id}')">Detail</button>
        </div>
      </div>
    `;
    container.appendChild(el);

    // lazy-load image fade-in
    const img = el.querySelector('img');
    if (img) {
      img.addEventListener('load', () => img.classList.add('loaded'));
    }
  });
}

function loadBooks() {
  db.collection('books').orderBy('createdAt','desc').onSnapshot(snap => {
    allBooks = [];
    snap.forEach(doc => {
      const d = doc.data();
      allBooks.push({
        id: doc.id,
        title: d.title,
        author: d.author,
        category: d.category,
        description: d.description,
        image: d.image,
        stock: d.stock || 0,
        reviews: d.reviews || 0,
        createdAt: d.createdAt
      });
    });
    renderBooks(allBooks.slice(0,12));
    updateStats();
  });
}
loadBooks();

// ---------- Filter & Search ----------
document.getElementById('filter-category')?.addEventListener('change', (e) => {
  applyFilters();
});
document.getElementById('search-book')?.addEventListener('input', (e) => {
  applyFilters();
});
function applyFilters() {
  const cat = document.getElementById('filter-category')?.value || '';
  const q = (document.getElementById('search-book')?.value || '').toLowerCase();
  let filtered = allBooks.filter(b => {
    return (cat ? b.category === cat : true) &&
           (q ? (b.title.toLowerCase().includes(q) || (b.author||'').toLowerCase().includes(q)) : true);
  });
  renderBooks(filtered);
}

// ---------- Book detail ----------
let currentBook = null;
function openBookDetail(id) {
  const b = allBooks.find(x => x.id === id);
  if (!b) return;
  currentBook = b;
  document.getElementById('book-title').innerText = b.title;
  document.getElementById('book-cover').src = b.image || 'images/book-placeholder.png';
  document.getElementById('book-author-name').innerText = b.author || '-';
  document.getElementById('book-category-name').innerText = b.category || '-';
  document.getElementById('book-description').innerText = b.description || '-';
  document.getElementById('book-stock').innerText = b.stock || 0;
  document.getElementById('book-isbn').innerText = b.isbn || '-';
  document.getElementById('book-publisher').innerText = b.publisher || '-';
  document.getElementById('book-status').innerText = b.stock > 0 ? 'Tersedia' : 'Habis';
  showModal('book-detail');
}

// Borrow button (requires auth)
document.getElementById('btn-borrow')?.addEventListener('click', async () => {
  if (!auth.currentUser) {
    alert('Silakan login terlebih dahulu untuk meminjam buku.');
    return;
  }
  if (!currentBook) return;
  if (currentBook.stock <= 0) { alert('Stok buku tidak mencukupi.'); return; }

  try {
    // create a loan transaction (simple example)
    await db.collection('loans').add({
      userId: auth.currentUser.uid,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Permintaan peminjaman terkirim. Admin akan mengonfirmasi.');
    hideModal('book-detail');
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Simple Charts (dummy data initially, can be replaced with Firestore queries) ----------
function renderLoanChart() {
  const ctx = document.getElementById('loanChart')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      datasets: [{
        label: 'Jumlah Peminjaman',
        data: [120, 150, 180, 200, 170, 190],
        borderColor: '#3b82f6',
        fill: false
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
renderLoanChart();

function renderAdminCharts() {
  const ctx1 = document.getElementById('recentLoansChart')?.getContext('2d');
  const ctx2 = document.getElementById('popularBooksChart')?.getContext('2d');
  if (ctx1) new Chart(ctx1, { type:'bar', data:{ labels:['Mon','Tue','Wed','Thu','Fri'], datasets:[{ label:'Peminjaman', data:[12,19,7,15,10], borderWidth:1 }] }, options:{responsive:true,maintainAspectRatio:false} });
  if (ctx2) new Chart(ctx2, { type:'bar', data:{ labels:['Bumi Manusia','Laut Bercerita','Sapiens'], datasets:[{ label:'Dipinjam', data:[45,38,29], borderWidth:1 }] }, options:{responsive:true,maintainAspectRatio:false} });
}
renderAdminCharts();

// ---------- Utility ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

// ---------- Stats updater (basic) ----------
function updateStats() {
  document.getElementById('stat-books').innerText = (allBooks.length || 0) + '+';
  // members & loans could be loaded from Firestore counters; left as example
}

// ---------- Contact & Newsletter handlers (basic) ----------
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Pesan terkirim. Terima kasih!');
  e.target.reset();
});
document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Terima kasih telah berlangganan!');
  e.target.reset();
});
