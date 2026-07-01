// ========== Unsplash Image URLs ==========
const UNSPLASH = {
    hero: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    about: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
};

const unsplashProducts = [
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80',
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80',
    'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=400&q=80',
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80',
    'https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400&q=80',
    'https://images.unsplash.com/photo-1562007908-17c67e878c88?w=400&q=80',
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80',
];

// ========== Product Data ==========
const products = [
    {
        id: 1, name: 'সোনালী প্রিয়া', desc: 'সোনালী কুন্দন ডিজাইনের চুড়ি সেট',
        price: 350, color: '#d4a853', colorName: 'golden', category: 'golden',
        sizes: ['M', 'L'], tag: 'বেস্টসেলার',
        image: 'images/733832621_122100670437377589_8124002593192263329_n.jpg'
    },
    {
        id: 2, name: 'লাল বাসন্তী', desc: 'লাল সুতা ও সোনালী কুন্দনের কম্বো',
        price: 400, color: '#c0392b', colorName: 'লাল', category: 'red',
        sizes: ['M', 'L', 'XL'], tag: '',
        image: 'images/734807988_122100671013377589_2240849957344200776_n.jpg'
    },
    {
        id: 3, name: 'শ্যামলী ব্লু', desc: 'নীল সুতা ও সিলভার কুন্দন ডিজাইন',
        price: 380, color: '#2980b9', colorName: 'নীল', category: 'blue',
        sizes: ['M', 'L'], tag: '',
        image: 'images/734846119_122100670683377589_5529426853677029458_n.jpg'
    },
    {
        id: 4, name: 'পার্সি গ্রিন', desc: 'সবুজ সুতা ও গোল্ডেন কুন্দন সেট',
        price: 450, color: '#27ae60', colorName: 'সবুজ', category: 'green',
        sizes: ['M', 'L', 'XL'], tag: 'নতুন',
        image: unsplashProducts[0]
    },
    {
        id: 5, name: 'মহারানী স্পেশাল', desc: 'ভিআইপি ডিজাইন — সোনালী কুন্দনে মোড়ানো',
        price: 900, color: '#8e44ad', colorName: 'বেগুনি', category: 'premium',
        sizes: ['M', 'L'], tag: 'প্রিমিয়াম',
        image: unsplashProducts[1]
    },
    {
        id: 6, name: 'সিঁদুরে সন্ধ্যা', desc: 'গভীর লাল ও সোনালী টুইস্ট',
        price: 500, color: '#e74c3c', colorName: 'গাঢ় লাল', category: 'red',
        sizes: ['M', 'L'], tag: '',
        image: unsplashProducts[2]
    },
    {
        id: 7, name: 'নীলিমা ড্রিম', desc: 'হালকা নীল ও রূপালী কুন্দন',
        price: 320, color: '#5dade2', colorName: 'হালকা নীল', category: 'blue',
        sizes: ['M'], tag: 'সাশ্রয়ী',
        image: unsplashProducts[3]
    },
    {
        id: 8, name: 'ক্যাশমিরি গোল্ড', desc: 'কাশ্মীরি স্টাইলে গোল্ডেন ব্রাইডাল সেট',
        price: 1000, color: '#f1c40f', colorName: 'গোল্ড', category: 'premium',
        sizes: ['M', 'L', 'XL'], tag: 'প্রিমিয়াম',
        image: unsplashProducts[4]
    },
    {
        id: 9, name: 'পালিশ গ্রিন', desc: 'পুদিনা সবুজ ও সাদা কুন্দন কম্বো',
        price: 370, color: '#2ecc71', colorName: 'পুদিনা', category: 'green',
        sizes: ['M', 'L'], tag: '',
        image: unsplashProducts[5]
    },
    {
        id: 10, name: 'বেগুনি আবীর', desc: 'বেগুনি-সোনালী থ্রি-পিস চুড়ি সেট',
        price: 420, color: '#9b59b6', colorName: 'বেগুনি', category: 'premium',
        sizes: ['M', 'L'], tag: '',
        image: unsplashProducts[6]
    }
];

// ========== Delivery Areas ==========
const deliveryAreas = [
    { value: 'উপশহর থেকে পিকআপ', charge: 0, display: 'ফ্রি' },
    { value: 'বগুড়া শহর হোম ডেলিভারি', charge: 0, display: '৫০৳ (আপাতত ফ্রি)' },
    { value: 'ঢাকার ভিতরে', charge: 100, display: '১০০৳' },
    { value: 'ঢাকার বাইরে/সারা দেশ', charge: 150, display: '১৫০৳' },
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
                <img src="${p.image}" alt="${p.name}" class="product-photo" loading="lazy" />
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
        display.style.color = '#d4a853';
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

    let delivery = 0;
    const areaSelect = document.getElementById('deliveryArea');
    const chargeDisplay = document.getElementById('deliveryChargeDisplay');
    const chargeInput = document.getElementById('deliveryChargeInput');
    if (areaSelect) {
        const area = deliveryAreas.find(a => a.value === areaSelect.value);
        if (area) {
            delivery = area.charge;
            if (chargeDisplay) chargeDisplay.textContent = area.display;
        } else {
            if (chargeDisplay) chargeDisplay.textContent = 'এরিয়া সিলেক্ট করুন';
        }
        if (chargeInput) chargeInput.value = delivery;
    }

    const total = (price * qty) + delivery;

    const totalEl = document.getElementById('totalAmount');
    const totalInput = document.getElementById('totalInput');
    if (totalEl) totalEl.textContent = `৳${total}`;
    if (totalInput) totalInput.value = total;
}

function resetOrder() {
    document.getElementById('orderSuccess').style.display = 'none';
    document.getElementById('orderForm').style.display = 'block';
    document.getElementById('orderForm').reset();
    document.getElementById('priceDisplay').textContent = 'প্রোডাক্ট সিলেক্ট করুন';
    const cd = document.getElementById('deliveryChargeDisplay');
    if (cd) cd.textContent = 'এরিয়া সিলেক্ট করুন';
    document.getElementById('totalAmount').textContent = '৳০';
    document.getElementById('totalInput').value = '0';
    document.getElementById('priceInput').value = '0';
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
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

// ========== Copy Mobile to WhatsApp ==========
function copyMobileToWhatsApp() {
    const mobile = document.querySelector('input[name="phone"]');
    const whatsapp = document.getElementById('whatsappInput');
    if (mobile && whatsapp && mobile.value) {
        whatsapp.value = mobile.value;
        whatsapp.style.borderColor = '#27ae60';
        whatsapp.style.background = 'rgba(39, 174, 96, 0.1)';
        setTimeout(() => {
            whatsapp.style.borderColor = '';
            whatsapp.style.background = '';
        }, 3000);
    }
}

// ========== Generate Order ID ==========
function generateOrderId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return 'MRN-' + y + m + d + '-' + rand;
}

// ========== Order Form Submit ==========
document.getElementById('orderForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'সাবমিট হচ্ছে...';
    btn.disabled = true;

    const orderId = generateOrderId();
    document.getElementById('orderIdInput').value = orderId;

    let iframe = document.getElementById('hiddenFrame');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hiddenFrame';
        iframe.name = 'hiddenFrame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    form.target = 'hiddenFrame';
    form.submit();

    document.getElementById('orderTrackingNumber').textContent = orderId;
    form.style.display = 'none';
    document.getElementById('orderSuccess').style.display = 'block';

    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', { value: 100, currency: 'BDT' });
    }

    setTimeout(function() {
        btn.textContent = 'অর্ডার কনফার্ম করুন';
        btn.disabled = false;
    }, 2000);
});

// ========== Click Tracking Number ==========
function clickTrackNumber() {
    var orderId = document.getElementById('orderTrackingNumber').textContent;
    document.getElementById('trackOrderInput').value = orderId;
    document.getElementById('track-order').scrollIntoView({ behavior: 'smooth' });
    trackOrder();
}

// ========== Track Order ==========
function trackOrder() {
    var input = document.getElementById('trackOrderInput');
    var result = document.getElementById('trackResult');
    var orderId = input.value.trim();

    if (!orderId) {
        result.style.display = 'block';
        result.innerHTML = '<div class="track-error">অর্ডার আইডি লিখুন</div>';
        return;
    }

    result.style.display = 'block';
    result.innerHTML = '<div class="track-loading">⏳ খোঁজা হচ্ছে...</div>';

    var scriptUrl = document.getElementById('orderForm').action;
    var cb = 'trackCB_' + Date.now();

    window[cb] = function(data) {
        delete window[cb];
        var s = document.getElementById('trackScript');
        if (s) s.remove();
        showTrackResult(data);
    };

    var s = document.createElement('script');
    s.id = 'trackScript';
    s.src = scriptUrl + '?action=track&order_id=' + encodeURIComponent(orderId) + '&callback=' + cb;
    s.onerror = function() {
        delete window[cb];
        result.innerHTML = '<div class="track-error">সার্ভারে সমস্যা। পরে আবার চেষ্টা করুন।</div>';
    };
    document.body.appendChild(s);
}

function showTrackResult(data) {
    var result = document.getElementById('trackResult');

    if (!data.found) {
        result.innerHTML = '<div class="track-error">❌ ' + data.message + '</div>';
        return;
    }

    var d = new Date(data.date);
    var dateStr = d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    result.innerHTML =
        '<div class="track-card" style="border-color:' + data.status_color + '">' +
            '<div class="track-header" style="background:' + data.status_color + '">' +
                '<span class="track-status-icon">' + data.status_emoji + '</span>' +
                '<span class="track-status-title">' + data.status_title + '</span>' +
            '</div>' +
            '<div class="track-body">' +
                '<div class="track-message">' + data.status_message + '</div>' +
                '<div class="track-details">' +
                    '<div class="track-detail-row"><span class="track-label">📋 অর্ডার নং</span><span class="track-value">' + data.order_id + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">👤 গ্রাহক</span><span class="track-value">' + data.name + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">📅 তারিখ</span><span class="track-value">' + dateStr + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">🛒 পণ্য</span><span class="track-value">' + data.product + ' — ' + data.size + ' (x' + data.quantity + ')</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">💰 মোট</span><span class="track-value">৳' + data.total + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">💳 পেমেন্ট</span><span class="track-value">' + data.payment + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">🚚 ডেলিভারি</span><span class="track-value">' + data.delivery_area + '</span></div>' +
                    '<div class="track-detail-row"><span class="track-label">📍 ঠিকানা</span><span class="track-value">' + data.address + '</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ========== Parallax Bangle Scene (mouse) ==========
document.addEventListener('DOMContentLoaded', function() {
    const scene = document.getElementById('bangleScene');
    if (scene) {
        document.addEventListener('mousemove', function(e) {
            const x = (e.clientX / window.innerWidth - 0.5) * 15;
            const y = (e.clientY / window.innerHeight - 0.5) * -15;
            scene.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
        });
    }
});

// ========== Init ==========
renderProducts();
populateSelect();
