// ========== Product Data ==========
const products = [
    {
        id: 1, name: 'সোনালী প্রিয়া', desc: 'সোনালী কুন্দন ডিজাইনের চুড়ি সেট',
        price: 350, color: '#d4a853', colorName: 'golden', category: 'golden',
        sizes: ['M', 'L'], tag: 'বেস্টসেলার'
    },
    {
        id: 2, name: 'লাল বাসন্তী', desc: 'লাল সুতা ও সোনালী কুন্দনের কম্বো',
        price: 400, color: '#c0392b', colorName: 'লাল', category: 'red',
        sizes: ['M', 'L', 'XL'], tag: ''
    },
    {
        id: 3, name: 'শ্যামলী ব্লু', desc: 'নীল সুতা ও সিলভার কুন্দন ডিজাইন',
        price: 380, color: '#2980b9', colorName: 'নীল', category: 'blue',
        sizes: ['M', 'L'], tag: ''
    },
    {
        id: 4, name: 'পার্সি গ্রিন', desc: 'সবুজ সুতা ও গোল্ডেন কুন্দন সেট',
        price: 450, color: '#27ae60', colorName: 'সবুজ', category: 'green',
        sizes: ['M', 'L', 'XL'], tag: 'নতুন'
    },
    {
        id: 5, name: 'মহারানী স্পেশাল', desc: 'ভিআইপি ডিজাইন — সোনালী কুন্দনে মোড়ানো',
        price: 900, color: '#8e44ad', colorName: 'বেগুনি', category: 'premium',
        sizes: ['M', 'L'], tag: 'প্রিমিয়াম'
    },
    {
        id: 6, name: 'সিঁদুরে সন্ধ্যা', desc: 'গভীর লাল ও সোনালী টুইস্ট',
        price: 500, color: '#e74c3c', colorName: 'গাঢ় লাল', category: 'red',
        sizes: ['M', 'L'], tag: ''
    },
    {
        id: 7, name: 'নীলিমা ড্রিম', desc: 'হালকা নীল ও রূপালী কুন্দন',
        price: 320, color: '#5dade2', colorName: 'হালকা নীল', category: 'blue',
        sizes: ['M'], tag: 'সাশ্রয়ী'
    },
    {
        id: 8, name: 'ক্যাশমিরি গোল্ড', desc: 'কাশ্মীরি স্টাইলে গোল্ডেন ব্রাইডাল সেট',
        price: 1000, color: '#f1c40f', colorName: 'গোল্ড', category: 'premium',
        sizes: ['M', 'L', 'XL'], tag: 'প্রিমিয়াম'
    },
    {
        id: 9, name: 'পালিশ গ্রিন', desc: 'পুদিনা সবুজ ও সাদা কুন্দন কম্বো',
        price: 370, color: '#2ecc71', colorName: 'পুদিনা', category: 'green',
        sizes: ['M', 'L'], tag: ''
    },
    {
        id: 10, name: 'বেগুনি আবীর', desc: 'বেগুনি-সোনালী থ্রি-পিস চুড়ি সেট',
        price: 420, color: '#9b59b6', colorName: 'বেগুনি', category: 'premium',
        sizes: ['M', 'L'], tag: ''
    }
];

// ========== Render Products ==========
let currentFilter = 'all';

function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const filtered = currentFilter === 'all'
        ? products
        : products.filter(p => p.category === currentFilter);

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-img">
                <div class="color-dot" style="background: ${p.color};"></div>
                ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="product-meta">
                    <span class="product-price">৳${p.price}</span>
                    <span class="product-size">সাইজ: ${p.sizes.join(', ')}</span>
                </div>
                <button class="order-now-btn" onclick="selectProduct('${p.id}')">অর্ডার করুন</button>
            </div>
        </div>
    `).join('');
}

function selectProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    const orderForm = document.getElementById('order-form');
    const productSelect = document.getElementById('productSelect');

    if (productSelect) {
        for (let opt of productSelect.options) {
            if (opt.value === `${product.name} - ৳${product.price}`) {
                opt.selected = true;
                updatePrice();
                break;
            }
        }
    }

    orderForm?.scrollIntoView({ behavior: 'smooth' });
}

function updatePrice() {
    const select = document.getElementById('productSelect');
    const display = document.getElementById('priceDisplay');
    const input = document.getElementById('priceInput');
    if (!select || !display) return;

    const val = select.value;
    const match = val.match(/৳(\d+)/);
    if (match) {
        const price = parseInt(match[1]);
        display.textContent = `৳${price}`;
        display.style.color = '#c0392b';
        input.value = price;
    } else {
        display.textContent = 'প্রোডাক্ট সিলেক্ট করুন';
        display.style.color = '#7f6b5e';
        input.value = 0;
    }
    calcTotal();
}

function calcTotal() {
    const price = parseInt(document.getElementById('priceInput')?.value || 0);
    const qty = parseInt(document.getElementById('quantityInput')?.value || 1);
    const discount = parseInt(document.getElementById('discountInput')?.value || 0);
    const delivery = parseInt(document.getElementById('deliveryInput')?.value || 0);
    const total = (price * qty) - discount + delivery;

    document.getElementById('totalAmount').textContent = `৳${total}`;
    document.getElementById('totalInput').value = total;
}

// ========== Filter Buttons ==========
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProducts();
});

// ========== Populate Product Select ==========
function populateSelect() {
    const select = document.getElementById('productSelect');
    if (!select) return;

    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = `${p.name} - ৳${p.price}`;
        opt.textContent = `${p.name} - ৳${p.price}`;
        select.appendChild(opt);
    });

    select.addEventListener('change', updatePrice);
    document.getElementById('deliveryInput')?.addEventListener('change', calcTotal);
}

// ========== Hamburger Menu ==========
document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
        document.getElementById('navLinks')?.classList.remove('open');
    });
});

// ========== Order Form Submit ==========
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'সাবমিট হচ্ছে...';
    btn.disabled = true;

    try {
        const data = new FormData(form);
        const params = new URLSearchParams();
        for (let [k, v] of data.entries()) params.append(k, v);

        const res = await fetch(form.action + '?' + params.toString(), { method: 'GET' });

        form.style.display = 'none';
        document.getElementById('orderSuccess').style.display = 'block';

        // Facebook Pixel event
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', { value: 100, currency: 'BDT' });
        }
    } catch (err) {
        btn.textContent = 'অর্ডার কনফার্ম করুন';
        btn.disabled = false;
        alert('সাবমিট করতে সমস্যা হয়েছে। সরাসরি মেসেঞ্জারে অর্ডার জানান।');
    }
});

// ========== Init ==========
renderProducts();
populateSelect();
