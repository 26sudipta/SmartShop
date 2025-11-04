/* === SmartShop main.js ===
 Features:
  - Fetch products from FakeStore API
  - Local reviews from reviews.json
  - Banner (auto + manual)
  - Product cards, search, category filter, sorting
  - Cart with subtotal, delivery, shipping, discount (SMART10)
  - Balance system with localStorage
  - Cart, balance persisted in localStorage
  - Review carousel (auto + manual)
  - Contact form validation
  - Dark mode toggle (stores preference)
*/

/* ---------- State ---------- */
const state = {
  userBalance: parseInt(localStorage.getItem('userBalance')) || 1000,
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  products: [],
  wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
  isLoading: false,
  appliedDiscount: parseInt(localStorage.getItem('appliedDiscount')) || 0
};

/* ---------- Banner ---------- */
const bannerImages = [
  { url: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg', title: 'Welcome to SmartShop' },
  { url: 'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg', title: 'Best Deals Available' },
  { url: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg', title: 'Shop Smart, Save More' },
  { url: 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg', title: 'Quality Products Guaranteed' }
];

function initBanner() {
  const container = document.getElementById('bannerSlides');
  const dotsContainer = document.getElementById('bannerDots');
  let current = 0;
  let slides = [];
  let dots = [];

  // Clear existing content
  container.innerHTML = '';
  dotsContainer.innerHTML = '';

  // Create slides and dots
  bannerImages.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'absolute inset-0 transition-opacity duration-1000 ease-in-out';
    slide.style.opacity = index === 0 ? '1' : '0';
    slide.style.visibility = index === 0 ? 'visible' : 'hidden';
    slide.innerHTML = `
      <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
        <h2 class="text-white text-3xl md:text-5xl font-bold">${item.title}</h2>
      </div>
    `;
    container.appendChild(slide);
    slides.push(slide);

    const dot = document.createElement('button');
    dot.className = `w-3 h-3 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`;
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dot.addEventListener('click', () => goTo(index));
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  function goTo(index) {
    if (index === current) return;

    slides[index].style.visibility = 'visible';
    requestAnimationFrame(() => {
      slides[current].style.opacity = '0';
      slides[index].style.opacity = '1';
      dots[current].className = 'w-3 h-3 rounded-full bg-white/50';
      dots[index].className = 'w-3 h-3 rounded-full bg-white';

      setTimeout(() => {
        slides[current].style.visibility = 'hidden';
        current = index;
      }, 1000);
    });
  }

  document.getElementById('nextBanner').addEventListener('click', () => goTo((current + 1) % slides.length));
  document.getElementById('prevBanner').addEventListener('click', () => goTo((current - 1 + slides.length) % slides.length));

  setInterval(() => {
    goTo((current + 1) % slides.length);
  }, 6000);
}

// Initialize on DOM ready
// DOMContentLoaded is handled in initialization


/* ---------- Fetch Products ---------- */
async function fetchProducts(){
  try {
    state.isLoading = true;
    document.getElementById('loadingProducts').style.display = 'block';
    
    const res = await fetch('https://fakestoreapi.com/products');
    const data = await res.json();
    
    // adjust prices to BDT (example multiply)
    state.products = data.map(p => ({...p, price: parseFloat(p.price) * 10}));
    
    // Save to localStorage and update display
    localStorage.setItem('products', JSON.stringify(state.products));
    document.getElementById('loadingProducts').style.display = 'none';
    displayProducts(state.products);
    
    // Initialize category filter on first load
    if (!document.getElementById('categoryFilter').hasChildNodes()) {
      populateCategoryFilter();
    }
  } catch (e) {
    document.getElementById('loadingProducts').innerHTML = `<p class="text-red-600">Failed to load products. Please check your network.</p>`;
  } finally {
    state.isLoading = false;
  }
}

function populateCategoryFilter(){
  const cats = [...new Set(state.products.map(p=>p.category))];
  const cf = document.getElementById('categoryFilter');
  cats.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    cf.appendChild(opt);
  });
}

/* ---------- Display Products ---------- */
function displayProducts(products){
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  
  products.forEach(product => {
    const stars = '⭐'.repeat(Math.round(product.rating?.rate || 0));
    const isWishlisted = state.wishlist?.includes(product.id);
    
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col';
    card.innerHTML = `
      <div class="relative h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700 mb-4">
        <img src="${product.image}" alt="${escapeHtml(product.title)}" class="max-h-40 object-contain p-2" loading="lazy" />
      </div>
      <div class="flex-1">
        <div class="text-xs text-gray-500 mb-1">${product.category}</div>
        <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">${escapeHtml(product.title)}</h3>
        <div class="flex items-center mb-2">
          <span class="text-yellow-500 text-sm">${stars}</span>
          <span class="text-gray-600 text-sm ml-2">(${product.rating?.count || 0})</span>
        </div>
      </div>
      <div class="mt-2 flex items-center justify-between">
        <div class="text-2xl font-bold text-blue-600">${Math.round(product.price)} BDT</div>
        <div class="flex gap-2">
          <button class="add-wishlist px-3 py-1 border rounded" data-id="${product.id}">${isWishlisted ? '♥' : '♡'}</button>
          <button class="add-cart bg-blue-600 text-white px-3 py-1 rounded" data-id="${product.id}">Add</button>
        </div>
      </div>
    `;

    // Use event delegation for better performance
    card.querySelector('.add-cart').addEventListener('click', e => 
      addToCart(Number(e.target.dataset.id))
    );
    card.querySelector('.add-wishlist').addEventListener('click', e => 
      toggleWishlist(Number(e.target.dataset.id), e.target)
    );
    
    grid.appendChild(card);
  });
}

/* ---------- Wishlist (extra feature) ---------- */
state.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
function toggleWishlist(id, btn){
  if(state.wishlist.includes(id)){
    state.wishlist = state.wishlist.filter(x => x !== id);
    btn.textContent = '♡';
  } else {
    state.wishlist.push(id);
    btn.textContent = '♥';
  }
  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
}

/* ---------- Cart Logic ---------- */
function addToCart(productId){
  const product = state.products.find(p => p.id === productId);
  if(!product) return;
  
  const existing = state.cart.find(i => i.id === productId);
  if(existing){
    existing.quantity++;
  } else {
    state.cart.push({...product, quantity: 1});
  }

  const total = calculateCartTotalValue();
  if(total > state.userBalance){
    // revert
    if(existing) {
      existing.quantity--;
    } else {
      state.cart = state.cart.filter(i => i.id !== productId);
    }
    showNotification('Insufficient balance! Add money to continue.', 'error');
    persistCart();
    updateCartUI();
    return;
  }

  persistCart();
  updateCartUI();
  showNotification(`${product.title} added to cart.`, 'success');
}

function removeFromCart(productId){
  const item = state.cart.find(i => i.id === productId);
  if(!item) return;
  
  if(item.quantity > 1) {
    item.quantity--;
  } else {
    state.cart = state.cart.filter(i => i.id !== productId);
  }
  
  persistCart();
  updateCartUI();
}

function deleteFromCart(productId){
  state.cart = state.cart.filter(i => i.id !== productId);
  persistCart();
  updateCartUI();
}

function calculateCartTotalValue(){
  const subtotal = state.cart.reduce((s, it) => s + (it.price * it.quantity), 0);
  const delivery = state.cart.length > 0 ? 50 : 0;
  const shipping = state.cart.length > 0 ? 30 : 0;
  const discount = (subtotal * (state.appliedDiscount || 0)) / 100;
  const total = subtotal + delivery + shipping - discount;
  return Math.max(0, Math.round(total));
}

/* ---------- Update Cart UI ---------- */
function updateCartUI(){
  const cartCountEl = document.getElementById('cartCount');
  const cartItemsEl = document.getElementById('cartItems');
  const emptyCart = document.getElementById('emptyCart');
  const cartSummary = document.getElementById('cartSummary');

  const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);
  cartCountEl.textContent = totalItems;

  if(state.cart.length === 0){
    emptyCart.classList.remove('hidden');
    cartSummary.classList.add('hidden');
    cartItemsEl.innerHTML = '';
    return;
  }
  
  emptyCart.classList.add('hidden');
  cartSummary.classList.remove('hidden');

  cartItemsEl.innerHTML = state.cart.map(item => `
    <div class="flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:shadow-md transition-shadow">
      <div class="w-20 h-20 bg-white dark:bg-gray-600 rounded-md p-2 flex items-center justify-center">
        <img src="${item.image}" class="w-full h-full object-contain" alt="${escapeHtml(item.title)}" loading="lazy" />
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-sm line-clamp-2">${escapeHtml(item.title)}</h4>
        <p class="text-blue-600 dark:text-blue-400 font-semibold mt-1">${Math.round(item.price)} BDT</p>
        <div class="flex items-center gap-2 mt-2">
          <div class="flex items-center bg-gray-100 dark:bg-gray-600 rounded-md">
            <button class="qty-dec w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 rounded-l-md transition-colors" data-id="${item.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
              </svg>
            </button>
            <span class="w-8 text-center font-medium text-sm">${item.quantity}</span>
            <button class="qty-inc w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 rounded-r-md transition-colors" data-id="${item.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
          <button class="delete-item ml-auto text-red-500 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${item.id}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Use event delegation for better performance
  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const id = Number(btn.dataset.id);
    if (btn.classList.contains('qty-dec')) removeFromCart(id);
    else if (btn.classList.contains('qty-inc')) addToCart(id);
    else if (btn.classList.contains('delete-item')) deleteFromCart(id);
  });

  // Update cart summary
  const subtotal = Math.round(state.cart.reduce((s,i) => s + (i.price * i.quantity), 0));
  const delivery = state.cart.length > 0 ? 50 : 0;
  const shipping = state.cart.length > 0 ? 30 : 0;
  const discount = Math.round((subtotal * (state.appliedDiscount || 0)) / 100);
  const total = subtotal + delivery + shipping - discount;

  document.getElementById('subtotal').textContent = `${subtotal} BDT`;
  document.getElementById('deliveryCharge').textContent = `${delivery} BDT`;
  document.getElementById('shippingCost').textContent = `${shipping} BDT`;
  document.getElementById('discount').textContent = `-${discount} BDT`;
  document.getElementById('total').textContent = `${Math.max(0, Math.round(total))} BDT`;
}

/* ---------- Persist state ---------- */
function persistCart(){
  localStorage.setItem('cart', JSON.stringify(state.cart));
}

function persistBalance(){
  localStorage.setItem('userBalance', state.userBalance);
}

function persistDiscount(){
  localStorage.setItem('appliedDiscount', state.appliedDiscount);
}

/* ---------- Balance UI ---------- */
function updateBalanceDisplay(){
  document.getElementById('userBalance').textContent = `${state.userBalance} BDT`;
  persistBalance();
}

/* ---------- Coupon ---------- */
function initCoupon(){
  document.getElementById('applyCoupon').addEventListener('click', () => {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msg = document.getElementById('couponMessage');
    msg.classList.remove('hidden');
    
    if(code === 'SMART10'){
      state.appliedDiscount = 10;
      msg.textContent = 'Coupon applied: 10% discount';
      msg.className = 'text-sm mt-2 text-green-600';
    } else if(code === ''){
      msg.textContent = 'Please enter a coupon code.';
      msg.className = 'text-sm mt-2 text-red-600';
    } else {
      state.appliedDiscount = 0;
      msg.textContent = 'Invalid coupon code.';
      msg.className = 'text-sm mt-2 text-red-600';
    }
    
    persistDiscount();
    updateCartUI();
  });
}

/* ---------- Checkout ---------- */
function initCheckout(){
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    const total = calculateCartTotalValue();
    if(total > state.userBalance){
      showNotification('Insufficient balance. Add money to checkout.', 'error');
      return;
    }
    
    // Process checkout
    state.userBalance -= total;
    updateBalanceDisplay();
    
    state.cart = [];
    persistCart();
    updateCartUI();
    showNotification('Order placed successfully! Thank you for shopping.', 'success');
    
    // Close cart
    closeCart();
  });
}

/* ---------- Cart UI open/close ---------- */
function initCartUI(){
  // Initialize appliedDiscount in state if it exists in localStorage
  state.appliedDiscount = parseInt(localStorage.getItem('appliedDiscount')) || 0;
  
  const cartToggle = document.getElementById('cartToggle');
  const cartSidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  document.getElementById('closeCart').addEventListener('click', closeCart);

  cartToggle.addEventListener('click', ()=> {
    openCart();
  });
  overlay.addEventListener('click', closeCart);

  function openCart(){
    // First make the cart visible but still translated
    cartSidebar.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    // Force a reflow to ensure the transition works
    cartSidebar.offsetHeight;
    
    // Then remove the transform to slide it in
    requestAnimationFrame(() => {
      cartSidebar.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
    });
  }
  window.openCart = openCart;

  function closeCart(){
    // Add the transform to slide it out
    cartSidebar.classList.add('translate-x-full');
    
    // Wait for animation to finish before hiding
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }, 300); // Match this with the transition duration
  }
  window.closeCart = closeCart;
}

/* ---------- Add Money ---------- */
function initAddMoney(){
  document.getElementById('addMoneyBtn').addEventListener('click', () => {
    state.userBalance += 1000;
    updateBalanceDisplay();
    showNotification('1000 BDT added to your balance!', 'success');
  });
}

/* ---------- Search / Filter / Sort ---------- */
function initFilters(){
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');
  const clearBtn = document.getElementById('clearFilters');
  
  function applyFilters(){
    let filtered = [...state.products];
    
    // Apply search
    const term = searchInput.value.trim().toLowerCase();
    if(term){
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    const cat = categoryFilter.value;
    if(cat && cat !== 'all') {
      filtered = filtered.filter(p => p.category === cat);
    }
    
    // Apply sorting
    const sortBy = sortFilter.value;
    switch(sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
        break;
    }
    
    displayProducts(filtered);
  }

  // Debounce search input
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });

  // Category and sort changes
  categoryFilter.addEventListener('change', applyFilters);
  sortFilter.addEventListener('change', applyFilters);
  
  // Clear all filters
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = 'all';
    sortFilter.value = 'default';
    applyFilters();
  });
}

/* ---------- Reviews (local JSON) ---------- */
async function initReviews(){
  try{
    const res = await fetch('reviews.json');
    const data = await res.json();
    const slider = document.getElementById('reviewsSlider');
    data.forEach(r=>{
      const card = document.createElement('div');
      card.className = 'flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-4';
      const stars = '⭐'.repeat(r.rating);
      card.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded shadow h-full">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">
              ${escapeHtml(r.name.charAt(0))}
            </div>
            <div>
              <h4 class="font-semibold">${escapeHtml(r.name)}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-300">${escapeHtml(r.date)}</p>
            </div>
          </div>
          <div class="text-yellow-500 mb-2">${stars}</div>
          <p class="text-gray-600 dark:text-gray-300">${escapeHtml(r.comment)}</p>
        </div>
      `;
      slider.appendChild(card);
    });

    let idx = 0;
    function updateSlider(){
      const cardWidth = slider.querySelector('div')?.offsetWidth || 300;
      slider.style.transform = `translateX(-${idx * cardWidth}px)`;
    }
    document.getElementById('nextReview').addEventListener('click', ()=> { idx = (idx+1) % data.length; updateSlider(); });
    document.getElementById('prevReview').addEventListener('click', ()=> { idx = (idx-1+data.length) % data.length; updateSlider(); });
    setInterval(()=> { idx = (idx+1) % data.length; updateSlider(); }, 6000);
    window.addEventListener('resize', updateSlider);
  } catch(e){
    console.error('Failed reviews', e);
  }
}

/* ---------- Contact Form Validation ---------- */
function initContactForm(){
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    let valid = true;
    const name = document.getElementById('contactName');
    const email = document.getElementById('contactEmail');
    const msg = document.getElementById('contactMessage');

    if(name.value.trim().length < 2){ showError('nameError'); valid = false; } else hideError('nameError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email.value.trim())){ showError('emailError'); valid = false; } else hideError('emailError');
    if(msg.value.trim().length < 10){ showError('messageError'); valid = false; } else hideError('messageError');

    if(valid){
      document.getElementById('thankYouMessage').classList.remove('hidden');
      form.reset();
      setTimeout(()=> document.getElementById('thankYouMessage').classList.add('hidden'), 4000);
    }
  });

  function showError(id){ document.getElementById(id).classList.remove('hidden'); }
  function hideError(id){ document.getElementById(id).classList.add('hidden'); }
}

/* ---------- Back to top ---------- */
function initBackToTop(){
  const btn = document.getElementById('backToTop');
  
  // Throttle scroll event for better performance
  let isScrolling = false;
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 300) {
          btn.classList.remove('hidden');
          btn.classList.add('animate-fade-in');
        } else {
          btn.classList.add('hidden');
          btn.classList.remove('animate-fade-in');
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  // Smooth scroll with easing
  btn.addEventListener('click', () => {
    const startPosition = window.pageYOffset;
    const duration = 600;
    const startTime = performance.now();
    
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    
    function scrollStep(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      window.scrollTo(0, startPosition * (1 - easeOutCubic(progress)));
      
      if (progress < 1) {
        window.requestAnimationFrame(scrollStep);
      }
    }
    
    window.requestAnimationFrame(scrollStep);
  });
}

/* ---------- Dark Mode Toggle ---------- */
function initDarkToggle(){
  const btn = document.getElementById('darkToggle');
  const pref = localStorage.getItem('darkMode') === 'true';
  if(pref) document.documentElement.classList.add('dark');
  btn.addEventListener('click', ()=> {
    document.documentElement.classList.toggle('dark');
    const on = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', on ? 'true' : 'false');
  });
  // show small icon on small screens
  document.getElementById('mobileMenuBtn').addEventListener('click', ()=>{
    document.getElementById('mobileMenu').classList.toggle('hidden');
  });
}

/* ---------- Small Helpers ---------- */
function showNotification(msg, type='success'){
  const n = document.createElement('div');
  n.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${type==='success' ? 'bg-green-500' : 'bg-red-500'}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(()=> { n.style.opacity = '0'; setTimeout(()=> n.remove(), 300); }, 3000);
}

function escapeHtml(str){
  if(!str) return '';
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/* ---------- Notifications for add/remove beyond balance handled in addToCart ---------- */

/* ---------- Initialization ---------- */
function initNewsletter() {
  const form = document.querySelector('footer form');
  const emailInput = form.querySelector('input[type="email"]');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Thanks for subscribing to our newsletter!', 'success');
      emailInput.value = '';
    } else {
      showNotification('Please enter a valid email address.', 'error');
    }
  });
}

function initializeApp(){
  // Initialize UI components
  initBanner();
  initDarkToggle();
  initCartUI();
  initCoupon();
  initCheckout();
  initAddMoney();
  initFilters();
  initContactForm();
  initBackToTop();
  initReviews();
  initNewsletter();
  
  // Load and display initial data
  updateBalanceDisplay();
  updateCartUI();
  
  // Fetch products (this will trigger displayProducts when done)
  fetchProducts();
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

/* ---------- Search/filter wiring ---------- */
function initFilters(){
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');
  const clearBtn = document.getElementById('clearFilters');

  function apply(){
    let result = [...allProducts];
    const term = searchInput.value.trim().toLowerCase();
    if(term) result = result.filter(p => p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
    const cat = categoryFilter.value;
    if(cat !== 'all') result = result.filter(p => p.category === cat);
    const sort = sortFilter.value;
    if(sort === 'price-low') result.sort((a,b)=> a.price - b.price);
    else if(sort === 'price-high') result.sort((a,b)=> b.price - a.price);
    else if(sort === 'rating') result.sort((a,b)=> (b.rating?.rate||0) - (a.rating?.rate||0));
    displayProducts(result);
  }

  searchInput.addEventListener('input', apply);
  categoryFilter.addEventListener('change', apply);
  sortFilter.addEventListener('change', apply);
  clearBtn.addEventListener('click', ()=> { searchInput.value=''; categoryFilter.value='all'; sortFilter.value='default'; apply();});
}

/* ---------- Start ---------- */
initializeApp();
