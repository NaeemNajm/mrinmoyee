# মৃন্ময়ী - Mrinmoyee ওয়েবসাইট সেটআপ গাইড

## ১. GitHub Pages-এ হোস্ট করা

### ধাপ ১: GitHub রিপোজিটরি তৈরি
1. [github.com](https://github.com)-এ অ্যাকাউন্ট না থাকলে তৈরি করুন
2. নতুন রিপোজিটরি তৈরি করুন: **mrinmoyee** (পাবলিক)
3. ফাইলগুলো আপলোড করুন (অথবা Git CLI ব্যবহার করে push করুন)

### ধাপ ২: GitHub Pages চালু
1. রিপোজিটরি > **Settings** > **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`, folder: `/ (root)`
4. **Save**
5. কয়েক মিনিট পর সাইট লাইভ হবে: `https://<username>.github.io/mrinmoyee/`

### ধাপ ৩: কাস্টম ডোমেইন সংযোগ
1. GitHub Pages Settings-এ আপনার ডোমেইন `mrinmoyee.labbaik.bd` লিখুন
2. **Save**
3. আপনার DNS প্রোভাইডারে **(যেখানে .bd ডোমেইন কিনেছেন)** এখানে **CNAME রেকর্ড** যোগ করুন:
   - **Type**: CNAME
   - **Name**: mrinmoyee (সাবডোমেইন)
   - **Value**: `<username>.github.io`
4. DNS প্রপাগেট হতে ২৪-৪৮ ঘণ্টা সময় লাগতে পারে

---

## ২. Google Sheets (অর্ডার ডাটাবেজ)

### Google Apps Script সেটআপ করুন যাতে ফর্মের ডেটা Google Sheet-এ যায়:

1. **Google Sheet তৈরি করুন**: [sheets.new](https://sheets.new)
   - Sheet-এর নাম দিন: `মৃন্ময়ী অর্ডার`

2. **Extensions > Apps Script** খুলুন
3. নিচের সম্পূর্ণ কোড কপি-পেস্ট করুন এবং **Save** করুন:

> ⚠️ **গুরুত্বপূর্ণ:** সোর্সকোডে `ADMIN_PASSWORD` নামে কোনো ভেরিয়েবল নেই। পাসওয়ার্ড সেট করতে ডিপ্লয়ের পর **`setAdminPassword()`** ফাংশন রান করুন। বিস্তারিত নিচে "নিরাপত্তা সেটআপ" সেকশনে দেওয়া আছে।

```javascript
// ========================================
// মৃন্ময়ী - Mrinmoyee v6 (সিকিউরিটি আপডেট)
// Token-based auth, rate limiting, input validation, PII protection
// ========================================

var HEADERS = ['সময়', 'নাম', 'মোবাইল', 'হোয়াটসঅ্যাপ', 'ঠিকানা', 'ডেলিভারি এরিয়া', 'ডেলিভারি চার্জ', 'পেমেন্ট', 'প্রোডাক্ট', 'সাইজ', 'পরিমাণ', 'মূল্য', 'নোট', 'নেট টোটাল', 'স্ট্যাটাস', 'WhatsApp লিংক', 'অর্ডার নং'];
var DASHBOARD_SHEET = '📊 সারাংশ';
var ORDER_SHEET = '📦 অর্ডার';
var STATUS_LIST = ['⏳ পেন্ডিং', '🔧 প্রসেসিং', '📦 শিপড', '✅ ডেলিভারড', '❌ বাতিল'];
var STATUS_COL = 15;
var WHATSAPP_COL = 16;

// Product Management
var PRODUCT_SHEET = '📦 প্রোডাক্ট';
var PRODUCT_HEADERS = ['id', 'name', 'description', 'price', 'color', 'colorName', 'category', 'sizes', 'tag', 'image', 'active'];

// পাসওয়ার্ড ScriptProperties-এ সেট করুন (নিচের ফাংশন প্রথমবার রান করান)
function setAdminPassword() {
  var ui = SpreadsheetApp.getUi();
  var pass = ui.prompt('নতুন অ্যাডমিন পাসওয়ার্ড দিন:').getResponseText();
  if (pass) {
    PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', pass);
    ui.alert('✅ পাসওয়ার্ড সেট হয়েছে!');
  }
}

function getAdminPassword() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
}

/* ===== Custom Menu ===== */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 মৃন্ময়ী')
    .addItem('⏳ পেন্ডিং', 'filterPending')
    .addItem('🔧 প্রসেসিং', 'filterProcessing')
    .addItem('📦 শিপড', 'filterShipped')
    .addItem('✅ ডেলিভারড', 'filterDelivered')
    .addItem('🔄 সব দেখান', 'filterAll')
    .addSeparator()
    .addItem('📊 ড্যাশবোর্ড রিফ্রেশ', 'refreshDashboard')
    .addSeparator()
    .addItem('📲 WhatsApp লিংক রিজেনারেট', 'regenerateWhatsAppLinks')
    .addToUi();
}

/* ===== Web App Handler ===== */
function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'track') return handleTrackRequest(e);
    if (e.parameter.action === 'getProducts') return handleGetProducts(e);
  }
  return handleRequest(e);
}

function doPost(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'auth') return handleAuth(e);
    if (e.parameter.action === 'saveProduct') return handleAdminRequest(e, 'saveProduct');
    if (e.parameter.action === 'deleteProduct') return handleAdminRequest(e, 'deleteProduct');
  }
  return handleRequest(e);
}

/* ===== Token/Auth Helpers ===== */
function generateToken() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var token = '';
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function validateToken(token) {
  if (!token) return false;
  var valid = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  return token === valid;
}

function checkRateLimit() {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  var attempts = parseInt(props.getProperty('RATE_ATTEMPTS') || '0');
  var blockUntil = parseInt(props.getProperty('RATE_BLOCK_UNTIL') || '0');
  if (now < blockUntil) return false;
  if (now > parseInt(props.getProperty('RATE_RESET') || '0')) {
    props.setProperty('RATE_ATTEMPTS', '0');
    props.setProperty('RATE_RESET', String(now + 60000));
  }
  return true;
}

function incrementRateLimit() {
  var props = PropertiesService.getScriptProperties();
  var attempts = parseInt(props.getProperty('RATE_ATTEMPTS') || '0') + 1;
  props.setProperty('RATE_ATTEMPTS', String(attempts));
  if (attempts >= 5) {
    props.setProperty('RATE_BLOCK_UNTIL', String(Date.now() + 60000));
    props.setProperty('RATE_ATTEMPTS', '0');
  }
}

/* ===== Admin Request Wrapper (auth + rate limit check) ===== */
function handleAdminRequest(e, action) {
  if (!checkRateLimit()) {
    return createJsonOutput({ success: false, message: 'অনেকবার চেষ্টা। ১ মিনিট পর আবার চেষ্টা করুন।' }, e.parameter.callback || '');
  }
  var token = e.parameter.token || '';
  if (!validateToken(token)) {
    incrementRateLimit();
    return createJsonOutput({ success: false, message: 'Unauthorized' }, e.parameter.callback || '');
  }
  if (action === 'saveProduct') return handleSaveProduct(e);
  if (action === 'deleteProduct') return handleDeleteProduct(e);
  return createJsonOutput({ success: false, message: 'Unknown action' }, '');
}

/* ===== Validate Order Input ===== */
function validateOrderInput(params) {
  var errors = [];
  if (!params.name || params.name.trim().length < 2) errors.push('নাম কমপক্ষে ২ অক্ষর');
  if (!params.phone || !/^01\d{9}$/.test(params.phone.replace(/[^0-9]/g,''))) errors.push('বৈধ মোবাইল নম্বর দিন');
  if (!params.address || params.address.trim().length < 5) errors.push('ঠিকানা কমপক্ষে ৫ অক্ষর');
  if (!params.product) errors.push('প্রোডাক্ট সিলেক্ট করুন');
  var qty = parseInt(params.quantity) || 0;
  if (qty < 1 || qty > 50) errors.push('পরিমাণ ১-৫০ এর মধ্যে হতে হবে');
  if (!params.payment_method) errors.push('পেমেন্ট মেথড সিলেক্ট করুন');
  return errors;
}

/* ===== Generate Order ID (server-side, more random) ===== */
function generateOrderId() {
  var now = new Date();
  var y = now.getFullYear();
  var m = ('0' + (now.getMonth() + 1)).slice(-2);
  var d = ('0' + now.getDate()).slice(-2);
  var rand = '';
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (var i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'MRN-' + y + m + d + '-' + rand;
}

/* ===== Order Handler ===== */
function handleRequest(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var sheet = ss.getSheetByName(ORDER_SHEET);
  var params = e ? e.parameter : {};

  // Input validation
  var validationErrors = validateOrderInput(params);
  if (validationErrors.length > 0) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, errors: validationErrors }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatHeader(sheet);
  }

  var qty = parseInt(params.quantity) || 1;
  var price = parseInt(params.price) || 0;
  var deliveryCharge = parseInt(params.delivery_charge) || 0;
  var total = (price * qty) + deliveryCharge;

  // Sanitize inputs
  var sanitize = function(str) { return String(str || '').replace(/<[^>]*>/g, '').trim(); };

  var orderId = generateOrderId();

  var row = [
    new Date(),
    sanitize(params.name),
    params.phone.replace(/[^0-9]/g, ''),
    params.whatsapp ? params.whatsapp.replace(/[^0-9]/g, '') : params.phone.replace(/[^0-9]/g, ''),
    sanitize(params.address),
    sanitize(params.delivery_area),
    deliveryCharge,
    sanitize(params.payment_method),
    sanitize(params.product),
    sanitize(params.size),
    qty,
    price,
    sanitize(params.note),
    total,
    '⏳ পেন্ডিং',
    '',
    orderId
  ];

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();
  formatRow(sheet, lastRow);
  sheet.getRange(lastRow, 3).setNumberFormat('@');
  sheet.getRange(lastRow, 4).setNumberFormat('@');
  setStatusDropdown(sheet, lastRow);
  setWhatsAppLink(sheet, lastRow);
  updateDashboard(ss);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, order_id: orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== Track Order ===== */
function handleTrackRequest(e) {
  var orderId = e.parameter.order_id;
  var callback = e.parameter.callback || '';

  if (!orderId) {
    return createJsonOutput({ found: false, message: 'অর্ডার আইডি দিন' }, callback);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ORDER_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return createJsonOutput({ found: false, message: 'কোনো অর্ডার পাওয়া যায়নি' }, callback);
  }

  var data = sheet.getDataRange().getValues();
  var statusMessages = {
    '⏳ পেন্ডিং': { title: 'অপেক্ষমাণ', emoji: '⏳', message: 'আপনার অর্ডারটি পেন্ডিং আছে। আমরা খুব শীঘ্রই এটি প্রসেসিং শুরু করব।', color: '#e67e22' },
    '🔧 প্রসেসিং': { title: 'প্রসেসিং', emoji: '🔧', message: 'আপনার অর্ডারটি প্রসেসিং চলছে। প্রস্তুত হলে শিপ করা হবে।', color: '#2980b9' },
    '📦 শিপড': { title: 'শিপড', emoji: '📦', message: 'আপনার অর্ডার শিপ করা হয়েছে! শীঘ্রই ডেলিভারি পাবেন।', color: '#8e44ad' },
    '✅ ডেলিভারড': { title: 'ডেলিভারড', emoji: '✅', message: 'আপনার অর্ডার ডেলিভারি সম্পন্ন হয়েছে। ধন্যবাদ!', color: '#27ae60' },
    '❌ বাতিল': { title: 'বাতিল', emoji: '❌', message: 'দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে।', color: '#c0392b' }
  };

  for (var i = 1; i < data.length; i++) {
    if (data[i][16] === orderId) {
      var status = data[i][14];
      var info = statusMessages[status] || { title: status, emoji: '❓', message: 'স্ট্যাটাস পাওয়া যায়নি', color: '#7f6b5e' };
      // PII সুরক্ষা: ফোন ও ঠিকানা ট্র্যাক রেস্পন্সে পাঠানো হচ্ছে না
      return createJsonOutput({
        found: true,
        order_id: data[i][16],
        name: data[i][1],
        product: data[i][8],
        size: data[i][9],
        quantity: data[i][10],
        total: data[i][13],
        date: data[i][0],
        delivery_area: data[i][5],
        payment: data[i][7],
        status: status,
        status_title: info.title,
        status_emoji: info.emoji,
        status_message: info.message,
        status_color: info.color
      }, callback);
    }
  }

  return createJsonOutput({ found: false, message: 'এই অর্ডার আইডি খুঁজে পাওয়া যায়নি। সঠিক অর্ডার নং দিন।' }, callback);
}

function createJsonOutput(data, callback) {
  var output = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + output + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== Status Dropdown ===== */
function setStatusDropdown(sheet, row) {
  var range = sheet.getRange(row, STATUS_COL);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_LIST, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
  applyStatusStyle(sheet, row, range.getValue());
}

function applyStatusStyle(sheet, row, status) {
  var range = sheet.getRange(row, STATUS_COL);
  switch (status) {
    case '⏳ পেন্ডিং':
      range.setBackground('#fef9e7').setFontColor('#e67e22').setFontWeight('bold');
      break;
    case '🔧 প্রসেসিং':
      range.setBackground('#ebf5fb').setFontColor('#2980b9').setFontWeight('bold');
      break;
    case '📦 শিপড':
      range.setBackground('#f4ecf7').setFontColor('#8e44ad').setFontWeight('bold');
      break;
    case '✅ ডেলিভারড':
      range.setBackground('#d5f5e3').setFontColor('#27ae60').setFontWeight('bold');
      break;
    case '❌ বাতিল':
      range.setBackground('#f2d7d5').setFontColor('#c0392b').setFontWeight('bold');
      break;
  }
}

/* ===== Auto-Color on Status Change ===== */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== ORDER_SHEET) return;
  if (range.getColumn() !== STATUS_COL) return;
  if (range.getRow() < 2) return;
  var status = range.getValue();
  if (STATUS_LIST.indexOf(status) !== -1) {
    applyStatusStyle(sheet, range.getRow(), status);
  }
}

/* ===== Setup onEdit Trigger (Run Once) ===== */
function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var hasTrigger = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onEdit') {
      hasTrigger = true;
      break;
    }
  }
  if (!hasTrigger) {
    ScriptApp.newTrigger('onEdit')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onEdit()
      .create();
    SpreadsheetApp.getUi().alert('onEdit ট্রিগার সেটআপ হয়েছে!');
  } else {
    SpreadsheetApp.getUi().alert('ট্রিগার আগেই সেটআপ করা আছে।');
  }
}

/* ===== WhatsApp Link (v5 — encodeURIComponent) ===== */
function setWhatsAppLink(sheet, row) {
  if (row <= 1) return;

  var data = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var name = String(data[1] || '');
  var whatsapp = String(data[3] || '').replace(/[^0-9]/g, '');
  var address = String(data[4] || '');
  var area = String(data[5] || '');
  var payment = String(data[7] || '');
  var product = String(data[8] || '');
  var size = String(data[9] || '');
  var qty = String(data[10] || '1');
  var total = String(data[13] || '0');
  var orderId = String(data[16] || '');

  var phone = whatsapp;
  if (phone.length === 11 && phone.charAt(0) === '0') phone = phone.substring(1);
  else if (phone.length === 14 && phone.indexOf('880') === 0) phone = phone.substring(3);
  else if (phone.length === 13 && phone.indexOf('88') === 0) phone = phone.substring(2);
  phone = phone.replace(/[^0-9]/g, '');

  if (phone.length < 9) {
    sheet.getRange(row, WHATSAPP_COL).setValue('Invalid Number');
    return;
  }

  var message = 'প্রিয় ' + name + '\n' +
    'মৃন্ময়ী - Mrinmoyee\n' +
    'অর্ডার: ' + orderId + '\n\n' +
    'ম্যাম/স্যার, আপনি কি অর্ডারটি কনফার্ম করতে চাচ্ছেন?\n\n' +
    'অর্ডার বিস্তারিত:\n' +
    'অর্ডার: ' + orderId + '\n' +
    'পণ্য: ' + product + ' - ' + size + ' (x' + qty + ')\n' +
    'মোট বিল: ৳' + total + '\n' +
    'ডেলিভারি: ' + area + '\n' +
    'ঠিকানা: ' + address + '\n' +
    'পেমেন্ট: ' + payment + '\n\n' +
    '---- আপনার মতামত দিন ----\n' +
    'গিফট র‍্যাপিং দরকার? (হ্যাঁ/না): \n' +
    'কোনো বিশেষ নোট থাকলে লিখুন: \n' +
    'স্পেশাল প্যাকেজিং দরকার? (হ্যাঁ/না): \n' +
    '------------------------\n\n' +
    'ঠিকানা ও ডিজাইন ঠিক আছে? কনফার্ম করলে প্রসেসিং শুরু করব।\n' +
    'ধন্যবাদ!';

  var url = 'https://wa.me/880' + phone + '?text=' + encodeURIComponent(message);

  var richValue = SpreadsheetApp.newRichTextValue()
    .setText('Open WhatsApp')
    .setLinkUrl(url)
    .build();

  sheet.getRange(row, WHATSAPP_COL).setRichTextValue(richValue);
}

/* ===== Regenerate All WhatsApp Links ===== */
function regenerateWhatsAppLinks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('কোনো অর্ডার পাওয়া যায়নি।');
    return;
  }
  var lastRow = sheet.getLastRow();
  for (var i = 2; i <= lastRow; i++) {
    setWhatsAppLink(sheet, i);
  }
  SpreadsheetApp.getUi().alert('WhatsApp লিংক রিজেনারেট করা হয়েছে!');
}

/* ===== Filter by Status ===== */
function filterPending() { filterByStatus('⏳ পেন্ডিং'); }
function filterProcessing() { filterByStatus('🔧 প্রসেসিং'); }
function filterShipped() { filterByStatus('📦 শিপড'); }
function filterDelivered() { filterByStatus('✅ ডেলিভারড'); }

function filterByStatus(status) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;
  if (sheet.getFilter()) sheet.getFilter().remove();
  var range = sheet.getRange(1, 1, sheet.getLastRow(), HEADERS.length);
  var filter = range.createFilter();
  filter.setColumnFilterCriteria(STATUS_COL, SpreadsheetApp.newFilterCriteria()
    .setVisibleValues([status]).build());
}

function filterAll() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sheet) return;
  if (sheet.getFilter()) sheet.getFilter().remove();
}

/* ===== Sheet Setup ===== */
function ensureSheets(ss) {
  var names = [ORDER_SHEET, DASHBOARD_SHEET];
  for (var i = 0; i < names.length; i++) {
    if (!ss.getSheetByName(names[i])) ss.insertSheet(names[i]);
  }
}

function formatHeader(sheet) {
  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#a93226', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setFrozenRows(1);
}

function formatRow(sheet, row) {
  sheet.getRange(row, 1, 1, HEADERS.length)
    .setBorder(true, true, true, true, null, null, '#ddd5cc', SpreadsheetApp.BorderStyle.SOLID);
  sheet.autoResizeColumns(1, HEADERS.length);
}

/* ===== Dashboard ===== */
function refreshDashboard() {
  updateDashboard(SpreadsheetApp.getActiveSpreadsheet());
}

function updateDashboard(ss) {
  var dash = ss.getSheetByName(DASHBOARD_SHEET);
  var orderSheet = ss.getSheetByName(ORDER_SHEET);
  if (!dash || !orderSheet) return;
  dash.clear();
  dash.getRange(1, 1, dash.getMaxRows(), dash.getMaxColumns()).breakApart();
  while (dash.getMaxRows() > 55) { dash.deleteRow(dash.getMaxRows()); }
  buildDashboard(dash, orderSheet);
}

function mergeAndStyle(sheet, start, end, text, fontSize, fontColor, bgColor, bold, rowH) {
  var r = sheet.getRange(start + ':' + end);
  r.merge().setValue(text).setFontSize(fontSize).setFontColor(fontColor).setBackground(bgColor).setHorizontalAlignment('center');
  if (bold) r.setFontWeight('bold');
  if (rowH) sheet.setRowHeight(r.getRow(), rowH);
}

function buildDashboard(dash, orderSheet) {
  var allData = orderSheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][1] && allData[i][1].toString().trim() !== '') rows.push(allData[i]);
  }
  var n = rows.length;

  mergeAndStyle(dash, 'A1', 'F1', '📊 মৃন্ময়ী - Mrinmoyee ড্যাশবোর্ড', 18, '#c0392b', '#fdf8f4', true, 40);

  var today = new Date(); today.setHours(0,0,0,0);
  var todayOrders=0, thisMonth=0, pending=0, delivered=0, canceled=0;
  var totalRevenue=0, productQty={}, productRev={}, areaCnt={}, payCnt={}, dailyOrders={};
  var bdMon = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

  for (var r=0; r<rows.length; r++) {
    var rd = new Date(rows[r][0]); rd.setHours(0,0,0,0);
    if (rd.getTime()===today.getTime()) todayOrders++;
    if (rd.getMonth()===today.getMonth() && rd.getFullYear()===today.getFullYear()) thisMonth++;
    var s = (rows[r][14]||'').toString().trim();
    if (s==='⏳ পেন্ডিং') pending++; else if (s==='✅ ডেলিভারড') delivered++; else if (s==='❌ বাতিল') canceled++;
    totalRevenue += parseInt(rows[r][13])||0;
    var pn = (rows[r][8]||'অজানা').toString().trim();
    var qt = parseInt(rows[r][10])||1;
    productQty[pn] = (productQty[pn]||0)+qt;
    productRev[pn] = (productRev[pn]||0)+(parseInt(rows[r][13])||0);
    var ar = (rows[r][5]||'অন্যান্য').toString().trim();
    areaCnt[ar] = (areaCnt[ar]||0)+1;
    var pm = (rows[r][7]||'COD').toString().trim();
    payCnt[pm] = (payCnt[pm]||0)+1;
    var dk = rd.getFullYear()+'-'+(rd.getMonth()+1)+'-'+rd.getDate();
    dailyOrders[dk] = (dailyOrders[dk]||0)+1;
  }

  var firstDate = n>0 ? new Date(rows[0][0]) : new Date();
  firstDate.setHours(0,0,0,0);
  var daysElapsed = Math.max(1, Math.round((today.getTime()-firstDate.getTime())/86400000)+1);
  var avgDaily = (n/daysElapsed).toFixed(1);

  var cards = [
    ['📦 মোট অর্ডার', n, '#c0392b'],
    ['💰 মোট আয় (৳)', totalRevenue, '#27ae60'],
    ['🕐 আজকের', todayOrders, '#2980b9'],
    ['📅 চলতি মাস', thisMonth, '#8e44ad'],
    ['⏳ পেন্ডিং', pending, '#e67e22'],
    ['📈 গড়/দিন', avgDaily, '#d4a853']
  ];
  for (var ci=0; ci<cards.length; ci++) {
    var col = ci<3?'A':'D';
    var crow = (ci<3?ci:(ci-3))+3;
    var cardVal = cards[ci][0];
    var cardNum = cards[ci][1].toString();
    var cardClr = cards[ci][2];
    dash.getRange(col+crow).setValue(cardVal).setFontSize(10).setFontColor('#7f6b5e')
      .setBackground('#fff').setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
    dash.getRange(col+crow).offset(0,1).setValue(cardNum).setFontSize(24).setFontWeight('bold')
      .setFontColor(cardClr).setBackground('#fff')
      .setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
    dash.getRange(col+crow).offset(0,2).clear();
    dash.setRowHeight(crow,55);
  }

  var row=7;
  mergeAndStyle(dash,'A'+row,'F'+row,'📊 স্ট্যাটাস ওভারভিউ',14,'#2d1b0e','#f0e4d9',true,30);
  row++;
  dash.getRange('A'+row+':B'+row).merge().setValue('স্ট্যাটাস').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('C'+row).setValue('কাউন্ট').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('D'+row+':F'+row).merge().setValue('প্রসেন্টেজ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  var stats = [
    ['⏳ পেন্ডিং',pending,'#e67e22','#fef9e7'],
    ['🔧 প্রসেসিং',0,'#2980b9','#ebf5fb'],
    ['📦 শিপড',0,'#8e44ad','#f4ecf7'],
    ['✅ ডেলিভারড',delivered,'#27ae60','#d5f5e3'],
    ['❌ বাতিল',canceled,'#c0392b','#f2d7d5']
  ];
  for (var rr=0; rr<rows.length; rr++) {
    var st = (rows[rr][14]||'').toString().trim();
    if (st==='🔧 প্রসেসিং') stats[1][1]++;
    else if (st==='📦 শিপড') stats[2][1]++;
  }
  for (var si=0; si<stats.length; si++) {
    var sr=row+1+si, cnt=stats[si][1], pct=n>0?(cnt/n*100).toFixed(1):'0.0';
    dash.getRange('A'+sr+':B'+sr).merge().setValue(stats[si][0]).setBackground(stats[si][3]).setFontColor(stats[si][2]).setFontWeight('bold');
    dash.getRange('C'+sr).setValue(cnt).setHorizontalAlignment('center').setFontWeight('bold');
    var barLen=Math.max(1,Math.round((cnt/Math.max(1,n))*40));
    var bar=''; for (var b=0; b<barLen&&b<40; b++) bar+='█';
    var pctStr=pct; if (pctStr.indexOf('.')>0) { var parts=pctStr.split('.'); pctStr=parts[0]+'.'+parts[1].charAt(0); }
    dash.getRange('D'+sr+':F'+sr).merge().setValue(bar+' '+pctStr+'%').setFontFamily('Courier New').setFontSize(10).setFontColor(stats[si][2]);
    dash.getRange('A'+sr+':F'+sr).setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
  }

  row = sr+2;
  mergeAndStyle(dash,'A'+row,'F'+row,'💳 পেমেন্ট মেথড',14,'#2d1b0e','#f0e4d9',true,30);
  row++;
  var payArr=[];
  for (var pk in payCnt) { if (payCnt.hasOwnProperty(pk)) payArr.push([pk,payCnt[pk]]); }
  payArr.sort(function(a,b){return b[1]-a[1];});
  dash.getRange('A'+row+':B'+row).merge().setValue('পদ্ধতি').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  dash.getRange('C'+row+':D'+row).merge().setValue('অর্ডার').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('E'+row+':F'+row).merge().setValue('%').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  for (var pi=0; pi<payArr.length; pi++) {
    var pr=row+1+pi, pc=payArr[pi][1], pp=n>0?(pc/n*100).toFixed(1):'0.0';
    dash.getRange('A'+pr+':B'+pr).merge().setValue(payArr[pi][0]).setFontSize(10);
    dash.getRange('C'+pr+':D'+pr).merge().setValue(pc).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('E'+pr+':F'+pr).merge().setValue(pp+'%').setHorizontalAlignment('center');
    dash.getRange('A'+pr+':F'+pr).setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
  }

  row = pr+2;
  mergeAndStyle(dash,'A'+row,'F'+row,'🚚 ডেলিভারি এরিয়া (টপ ১০)',14,'#2d1b0e','#f0e4d9',true,30);
  row++;
  var areaArr=[];
  for (var ak in areaCnt) { if (areaCnt.hasOwnProperty(ak)) areaArr.push([ak,areaCnt[ak]]); }
  areaArr.sort(function(a,b){return b[1]-a[1];});
  dash.getRange('A'+row+':C'+row).merge().setValue('এলাকা').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  dash.getRange('D'+row+':E'+row).merge().setValue('অর্ডার').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('F'+row).setValue('%').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  for (var ai=0; ai<Math.min(areaArr.length,10); ai++) {
    var ar=row+1+ai, ac=areaArr[ai][1], ap=n>0?(ac/n*100).toFixed(1):'0.0';
    dash.getRange('A'+ar+':C'+ar).merge().setValue(areaArr[ai][0]).setFontSize(10);
    dash.getRange('D'+ar+':E'+ar).merge().setValue(ac).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('F'+ar).setValue(ap+'%').setHorizontalAlignment('center');
    dash.getRange('A'+ar+':F'+ar).setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
  }

  row = ar+2;
  mergeAndStyle(dash,'A'+row,'F'+row,'🏆 জনপ্রিয় প্রোডাক্ট',14,'#2d1b0e','#f0e4d9',true,30);
  row++;
  var prodList=[];
  for (var pn2 in productQty) { if (productQty.hasOwnProperty(pn2)) prodList.push([pn2,productQty[pn2],productRev[pn2]||0]); }
  prodList.sort(function(a,b){return b[1]-a[1];});
  prodList=prodList.slice(0,8);
  var pHdrs=[['A','#'],['B:C','প্রোডাক্ট'],['D','বিক্রি'],['E:F','আয় (৳)']];
  for (var hi=0; hi<pHdrs.length; hi++) {
    var hCol=pHdrs[hi][0];
    if (hCol.indexOf(':')>-1) {
      var pts=hCol.split(':');
      dash.getRange(pts[0]+row+':'+pts[1]+row).merge().setValue(pHdrs[hi][1]).setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
    } else {
      dash.getRange(hCol+row).setValue(pHdrs[hi][1]).setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
    }
  }
  for (var pii=0; pii<prodList.length; pii++) {
    var pr2=row+1+pii;
    dash.getRange('A'+pr2).setValue(pii+1).setHorizontalAlignment('center');
    dash.getRange('B'+pr2+':C'+pr2).merge().setValue(prodList[pii][0]).setFontSize(10);
    dash.getRange('D'+pr2).setValue(prodList[pii][1]).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('E'+pr2+':F'+pr2).merge().setValue(prodList[pii][2]).setHorizontalAlignment('right').setFontColor('#27ae60').setFontWeight('bold');
    dash.getRange('A'+pr2+':F'+pr2).setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID).setBackground(pii%2===0?'#fdf8f4':'#fff');
  }

  row = pr2+2;
  mergeAndStyle(dash,'A'+row,'F'+row,'📆 গত ৭ দিনের অর্ডার ট্রেন্ড',14,'#2d1b0e','#f0e4d9',true,30);
  row++;
  var trendData=[];
  for (var d=6; d>=0; d--) {
    var dt=new Date(today); dt.setDate(dt.getDate()-d);
    var dk2=dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
    trendData.push({label:dt.getDate()+' '+bdMon[dt.getMonth()].substring(0,3), count:dailyOrders[dk2]||0});
  }
  var maxC=1;
  for (var ti=0; ti<trendData.length; ti++) { if (trendData[ti].count>maxC) maxC=trendData[ti].count; }
  dash.getRange('A'+row).setValue('তারিখ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('B'+row+':E'+row).merge().setValue('গ্রাফ (█='+Math.ceil(maxC/20)+' অর্ডার)').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('F'+row).setValue('অর্ডার').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  for (var tii=0; tii<trendData.length; tii++) {
    var tr2=row+1+tii, val=trendData[tii].count;
    var barLen2=maxC>0?Math.round((val/maxC)*20):0; if (barLen2<1&&val>0) barLen2=1;
    var barStr=''; for (var b2=0; b2<barLen2; b2++) barStr+='█';
    dash.getRange('A'+tr2).setValue(trendData[tii].label).setFontSize(10).setHorizontalAlignment('center');
    dash.getRange('B'+tr2+':E'+tr2).merge().setValue(barStr).setFontFamily('Courier New').setFontSize(12).setFontColor(val>0?'#27ae60':'#ddd5cc');
    dash.getRange('F'+tr2).setValue(val).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('A'+tr2+':F'+tr2).setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
  }

  dash.autoResizeColumns(1,6);
  dash.setColumnWidth(2,180);
  dash.setColumnWidth(5,120);
}

// ========================================
// Product Management API
// ========================================

function ensureProductSheet(ss) {
  var sheet = ss.getSheetByName(PRODUCT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PRODUCT_SHEET);
    sheet.appendRow(PRODUCT_HEADERS);
    sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length)
      .setBackground('#8e44ad').setFontColor('#fff').setFontWeight('bold')
      .setFrozenRows(1);
    initSampleProducts(sheet);
  }
  return sheet;
}

function initSampleProducts(sheet) {
  var samples = [
    [1,'সোনালী প্রিয়া','সোনালী কুন্দন ডিজাইনের চুড়ি সেট',350,'#d4a853','golden','golden','M, L','বেস্টসেলার','images/733832621_122100670437377589_8124002593192263329_n.jpg','YES'],
    [2,'লাল বাসন্তী','লাল সুতা ও সোনালী কুন্দনের কম্বো',400,'#c0392b','লাল','red','M, L, XL','','images/734807988_122100671013377589_2240849957344200776_n.jpg','YES'],
    [3,'শ্যামলী ব্লু','নীল সুতা ও সিলভার কুন্দন ডিজাইন',380,'#2980b9','নীল','blue','M, L','','images/734846119_122100670683377589_5529426853677029458_n.jpg','YES'],
    [4,'পার্সি গ্রিন','সবুজ সুতা ও গোল্ডেন কুন্দন সেট',450,'#27ae60','সবুজ','green','M, L, XL','নতুন','https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80','YES'],
    [5,'মহারানী স্পেশাল','ভিআইপি ডিজাইন — সোনালী কুন্দনে মোড়ানো',900,'#8e44ad','বেগুনি','premium','M, L','প্রিমিয়াম','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80','YES'],
    [6,'সিঁদুরে সন্ধ্যা','গভীর লাল ও সোনালী টুইস্ট',500,'#e74c3c','গাঢ় লাল','red','M, L','','https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=400&q=80','YES'],
    [7,'নীলিমা ড্রিম','হালকা নীল ও রূপালী কুন্দন',320,'#5dade2','হালকা নীল','blue','M','সাশ্রয়ী','https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80','YES'],
    [8,'ক্যাশমিরি গোল্ড','কাশ্মীরি স্টাইলে গোল্ডেন ব্রাইডাল সেট',1000,'#f1c40f','গোল্ড','premium','M, L, XL','প্রিমিয়াম','https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400&q=80','YES'],
    [9,'পালিশ গ্রিন','পুদিনা সবুজ ও সাদা কুন্দন কম্বো',370,'#2ecc71','পুদিনা','green','M, L','','https://images.unsplash.com/photo-1562007908-17c67e878c88?w=400&q=80','YES'],
    [10,'বেগুনি আবীর','বেগুনি-সোনালী থ্রি-পিস চুড়ি সেট',420,'#9b59b6','বেগুনি','premium','M, L','','https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80','YES']
  ];
  for (var i = 0; i < samples.length; i++) {
    sheet.appendRow(samples[i]);
  }
}

function handleGetProducts(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureProductSheet(ss);
  var data = sheet.getDataRange().getValues();
  var products = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][10] === 'NO') continue;
    products.push({
      id: data[i][0],
      name: data[i][1],
      desc: data[i][2],
      price: data[i][3],
      color: data[i][4],
      colorName: data[i][5],
      category: data[i][6],
      sizes: data[i][7],
      tag: data[i][8],
      image: data[i][9],
      active: data[i][10]
    });
  }
  var cb = (e && e.parameter && e.parameter.callback) || '';
  return createJsonOutput({ success: true, products: products }, cb);
}

function handleSaveProduct(e) {
  if (!e || !e.parameter) return createJsonOutput({ success: false, message: 'No data' }, '');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureProductSheet(ss);
  var data = sheet.getDataRange().getValues();
  var newId = parseInt(e.parameter.id) || 0;
  var rowIndex = -1;

  if (newId > 0) {
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0]) === newId) { rowIndex = i + 1; break; }
    }
  } else {
    var maxId = 0;
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0]) > maxId) maxId = parseInt(data[i][0]);
    }
    newId = maxId + 1;
  }

  var row = [
    newId,
    e.parameter.name || '',
    e.parameter.desc || '',
    parseInt(e.parameter.price) || 0,
    e.parameter.color || '#999',
    e.parameter.colorName || '',
    e.parameter.category || 'golden',
    e.parameter.sizes || 'M, L',
    e.parameter.tag || '',
    e.parameter.image || '',
    e.parameter.active || 'YES'
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, PRODUCT_HEADERS.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  var cb = e.parameter.callback || '';
  return createJsonOutput({ success: true, id: newId }, cb);
}

function handleDeleteProduct(e) {
  if (!e || !e.parameter) return createJsonOutput({ success: false, message: 'No data' }, '');

  var id = parseInt(e.parameter.id) || 0;
  if (!id) return createJsonOutput({ success: false, message: 'Invalid ID' }, e.parameter.callback || '');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureProductSheet(ss);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return createJsonOutput({ success: true }, e.parameter.callback || '');
    }
  }
  return createJsonOutput({ success: false, message: 'Product not found' }, e.parameter.callback || '');
}

function handleAuth(e) {
  if (!e || !e.parameter) return createJsonOutput({ success: false, message: 'No data' }, '');
  var valid = e.parameter.password === getAdminPassword();
  if (!valid) return createJsonOutput({ success: false, message: 'ভুল পাসওয়ার্ড' }, '');
  var token = generateToken();
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', token);
  return createJsonOutput({ success: true, token: token }, '');
}
```

4. **Deploy > New deployment** > Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**
5. **ওয়েব অ্যাপের URL** কপি করে `index.html` ফাইলে `YOUR_GOOGLE_APPS_SCRIPT_ID` জায়গায় বসান

### নিরাপত্তা সেটআপ (প্রথমবার বাধ্যতামূলক)

প্রথমবার ডিপ্লয়ের পর এই ধাপগুলো **অবশ্যই** করুন:

1. **অ্যাডমিন পাসওয়ার্ড সেট করুন:**
   - Apps Script এডিটরে **Execute > Run function > setAdminPassword** সিলেক্ট করুন
   - পপআপে আপনার পছন্দের পাসওয়ার্ড লিখুন
   - পাসওয়ার্ডটি `PropertiesService`-এ এনক্রিপ্টেড আকারে সংরক্ষিত হবে (কোডে কোথাও থাকবে না)

2. **`onEdit` ট্রিগার সেট করুন:**
   - Apps Script এডিটরে **Execute > Run function > setupTrigger** সিলেক্ট করুন
   - অনুমতি দিলে automatically `onEdit` ট্রিগার সেট হবে

3. **টোকেন সিস্টেম:** প্রতিবার `admin.html`-এ সফল লগইনের পর ৩২ ক্যারেক্টারের র‍্যান্ডম টোকেন জেনারেট হয়। এই টোকেন `sessionStorage`-এ সংরক্ষিত থাকে (ট্যাব বন্ধ করেই মুছে যায়)।

> **⚠️ পুরনো ডেটা থাকলে:** এই ভার্সনে কলাম的结构 বদলেছে। আগের শীট থাকলে **নতুন শীট তৈরি** করে সেটআপ করুন, অথবা আগের শীটের ডেটা ব্যাকআপ নিয়ে কলাম এডিট করে নিন।

### স্ট্যাটাস ড্রপডাউন + অটো-কালারিং

`setupTrigger()` ট্রিগার সেট করার পর শীটে স্ট্যাটাস পরিবর্তন করলেই অটো কালার হয়ে যাবে (উপরের ধাপ ২ দেখুন)।

### WhatsApp One-Click Send (v5)

শীটের **WhatsApp লিংক** কলামে ক্লিক করলেই WhatsApp ওপেন হবে — এখন ইমোজি ঠিকভাবে দেখাবে এবং ৩টি নতুন প্রশ্ন যুক্ত হয়েছে:

```
প্রিয় [নাম],
মৃন্ময়ী - Mrinmoyee
অর্ডার: [অর্ডার নং]

ম্যাম/স্যার, আপনি কি অর্ডারটি কনফার্ম করতে চাচ্ছেন?

অর্ডার বিস্তারিত:
অর্ডার: [অর্ডার নং]
পণ্য: [প্রোডাক্ট] - [সাইজ] (x[পরিমাণ])
মোট বিল: ৳[টোটাল]
ডেলিভারি: [এরিয়া]
ঠিকানা: [ঠিকানা]
পেমেন্ট: [পেমেন্ট]

---- আপনার মতামত দিন ----
গিফট র‍্যাপিং দরকার? (হ্যাঁ/না):
কোনো বিশেষ নোট থাকলে লিখুন:
স্পেশাল প্যাকেজিং দরকার? (হ্যাঁ/না):
------------------------

ঠিকানা ও ডিজাইন ঠিক আছে? কনফার্ম করলে প্রসেসিং শুরু করব।
ধন্যবাদ!
```

> **ইমোজি ফিক্স:** পুরনো ভার্সনে Google Sheets-এর `ENCODEURL` ফাংশন ইমোজি ঠিকমতো encode করতে পারত না। v5-এ `encodeURIComponent()` ব্যবহার করে Apps Script-এর ভিতরেই URL জেনারেট করা হয়েছে — ফলে WhatsApp-এ ইমোজি প্রশ্নবোধক চিহ্ন (`?`) হিসেবে দেখানোর সমস্যা আর থাকবে না।

> **নতুন:** মেনুতে **📲 WhatsApp লিংক রিজেনারেট** অপশন যোগ করা হয়েছে। পুরনো অর্ডারগুলোর জন্যও লিংক আপডেট করতে চাইলে এটি ব্যবহার করুন।

---

## ৩. প্রোডাক্ট ম্যানেজমেন্ট (অ্যাডমিন প্যানেল)

অ্যাডমিন প্যানেল থেকে আপনি নিজেই প্রোডাক্ট এড/এডিট/ডিলিট করতে পারবেন — সোর্সকোড না ছুঁয়ে।



### পুনরায় Deploy করুন

1. Apps Script এডিটরে গিয়ে **Save** করুন (🖴 আইকন)
2. **Deploy > New deployment** > **Type: Web app**
3. **Execute as: Me**, **Who has access: Anyone**
4. **Deploy** — নতুন URL নিয়ে চিন্তা নেই, আগের URL-ই কাজ করবে
5. অনুমতি চাইলে **Review permissions** > আপনার অ্যাকাউন্ট > **Allow**

### অ্যাডমিন প্যানেল ব্যবহার

1. আপনার সাইটে `admin.html` পেজে যান (যেমন: `https://<username>.github.io/mrinmoyee/admin.html`)
2. প্রথমবার: Apps Script এডিটর থেকে **`setAdminPassword()`** ফাংশন রান করুন — পাসওয়ার্ড সেট হয়ে যাবে
3. পাসওয়ার্ড দিয়ে লগইন করলে একটি টোকেন জেনারেট হবে (সেশন চলে পর্যন্ত বৈধ)
4. **প্রোডাক্ট লিস্ট** — সব প্রোডাক্ট দেখাবে
5. **+ নতুন প্রোডাক্ট** — নতুন প্রোডাক্ট যোগ করুন
6. **সম্পাদনা** — বিদ্যমান প্রোডাক্ট এডিট করুন
7. **ডিলিট** — প্রোডাক্ট মুছুন
8. **রিফ্রেশ** — Google Sheets থেকে নতুন ডেটা আনুন

> SEO / জেনারেল ভিজিটররা `admin.html` খুঁজে পাবেন না — শুধু আপনি যারা URL জানেন তারাই অ্যাক্সেস করতে পারেন।
> 
> **নিরাপত্তা:** পাসওয়ার্ড আর কোডে বা URL-এ থাকে না। API কলগুলো POST-এ যায়, টোকেন sessionStorage-এ সংরক্ষিত থাকে।

### WhatsApp লিংক রিজেনারেট

Apps Script-এ নতুন **"📲 WhatsApp লিংক রিজেনারেট"** মেনু অপশন যোগ করা হয়েছে। এটি শীটের মধ্যে ম্যানুয়ালি করতেও পারেন:
1. শীটের **Extensions > Apps Script** খুলুন
2. `regenerateWhatsAppLinks` ফাংশন রান করুন
3. সব অর্ডারের জন্য WhatsApp লিংক আপডেট হবে

---

## ৪. Facebook Pixel সেটআপ

### ধাপ ১: Pixel তৈরি
1. [business.facebook.com](https://business.facebook.com) > **Meta Business Suite** > **Events Manager**
2. **Connect data sources** > **Web** > **Facebook Pixel**
3. Pixel-এর নাম দিন: `মৃন্ময়ী`
4. পিক্সেল আইডি কপি করে নিন (লম্বা নাম্বার)

### ধাপ ২: কোডে বসান
`index.html` ফাইলে `YOUR_PIXEL_ID_here` জায়গায় পিক্সেল আইডি বসান

```html
fbq('init', '123456789012345');  // আপনার পিক্সেল আইডি
```

---

## ৫. Messenger Chatbot (অটো রিপ্লাই)

### ধাপ ১: Facebook Page ID খুঁজুন
1. [facebook.com/MrinmoyeeChuri](https://facebook.com/MrinmoyeeChuri) পেজে যান
2. পেজের **About** সেকশন থেকে Page ID কপি করুন

### ধাপ ২: কোডে বসান
`index.html` ফাইলে `YOUR_PAGE_ID` জায়গায় Page ID বসান

### ধাপ ৩: Meta Developer Console
1. [developers.facebook.com](https://developers.facebook.com) > **My Apps** > **Create App**
2. App type: **Business**
3. **Products** > **Messenger** > **Set up**
4. আপনার পেজ সিলেক্ট করুন
5. **Access Token** জেনারেট করুন

### ধাপ ৪: অটো রিপ্লাই (ManyChat — নন-কোডিং)
ManyChat ফ্রি প্ল্যানে Messenger অটোমেশন করা যায়:

1. [manychat.com](https://manychat.com) > Sign up with Facebook
2. আপনার পেজ কানেক্ট করুন
3. **Automation** > **Create New** > **Trigger**: When a user sends a message
4. Keyword-based reply সেট করুন (যেমন: "অর্ডার", "দাম", "হ্যালো")
5. Auto Reply Message সেট করুন:
```
🙏 ধন্যবাদ মৃন্ময়ীতে মেসেজ দেওয়ার জন্য!

আমাদের প্রোডাক্ট দেখুন: https://mrinmoyee.labbaik.bd/#products

অর্ডার করতে: https://mrinmoyee.labbaik.bd/#order-form

যে কোনো জিজ্ঞাসা ২৪ ঘণ্টার মধ্যে উত্তর দেব। ধৈর্য ধরার জন্য ধন্যবাদ! 💛
```

---

## ৬. ফাইল লিস্ট

| ফাইল | কী করে |
|------|--------|
| `index.html` | মূল ওয়েবপেজ (সব কন্টেন্ট) |
| `style.css` | ডিজাইন ও রেসপন্সিভ স্টাইল |
| `script.js` | প্রোডাক্ট রেন্ডার, ফিল্টার, অর্ডার ফর্ম |
| `admin.html` | অ্যাডমিন প্যানেল (প্রোডাক্ট ম্যানেজমেন্ট) |
| `images/` | প্রোডাক্টের ছবি রাখার ফোল্ডার |

---

## ৭. প্রোডাক্ট ছবি যোগ করা

বর্তমানে কালার ডট দেখাচ্ছে। পণ্যের আসল ছবি যোগ করতে `script.js`-এ প্রতিটি প্রোডাক্টে ইমেজ URL যোগ করুন:

```javascript
{
  id: 1,
  name: 'সোনালী প্রিয়া',
  image: 'images/sonali-priya.jpg',  // ✅ আসল ছবির পাথ
  // ...
}
```

এবং HTML টেমপ্লেটেও ইমেজ দেখানোর ব্যবস্থা আছে।

---

## ৮. ইমেজ অপ্টিমাইজেশন (WebP)

পেজ স্পিডের জন্য ছবিগুলো **WebP** ফরম্যাটে রূপান্তর করা ভালো:

1. [squoosh.app](https://squoosh.app) বা [convertio.co](https://convertio.co) ব্যবহার করে JPG/PNG → WebP করুন
2. `images/` ফোল্ডারে WebP ভার্সন যোগ করুন
3. `script.js`-এ ইমেজ পাথ আপডেট করুন (`.jpg` → `.webp`)
4. অথবা `<picture>` ট্যাগ ব্যবহার করতে পারেন (HTML পরিবর্তন করে):

```html
<picture>
  <source srcset="images/photo.webp" type="image/webp">
  <img src="images/photo.jpg" alt="ছবি">
</picture>
```

> **নোট:** বর্তমানে সব ছবিতে `loading="lazy"` অ্যাট্রিবিউট আছে (viewport-এর নিচের ছবিগুলো পরে লোড হবে)। হিরো ইমেজের `loading="lazy"` সরিয়ে দিলে LCP (Largest Contentful Paint) উন্নত হতে পারে।

---

**কোনো ধাপে আটকালে জানাবেন, আমি সাহায্য করব!**
