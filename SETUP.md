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

```javascript
// ========================================
// মৃন্ময়ী - Mrinmoyee অর্ডার ম্যানেজমেন্ট v4
// ইংরেজি ফাংশন নাম (web app এরর এড়াতে)
// ========================================

var HEADERS = ['সময়', 'নাম', 'মোবাইল', 'হোয়াটসঅ্যাপ', 'ঠিকানা', 'ডেলিভারি এরিয়া', 'ডেলিভারি চার্জ', 'পেমেন্ট', 'প্রোডাক্ট', 'সাইজ', 'পরিমাণ', 'মূল্য', 'নোট', 'নেট টোটাল', 'স্ট্যাটাস', 'WhatsApp লিংক', 'অর্ডার নং'];
var DASHBOARD_SHEET = '📊 সারাংশ';
var ORDER_SHEET = '📦 অর্ডার';
var STATUS_LIST = ['⏳ পেন্ডিং', '🔧 প্রসেসিং', '📦 শিপড', '✅ ডেলিভারড', '❌ বাতিল'];
var STATUS_COL = 15;
var WHATSAPP_COL = 16;

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
    .addToUi();
}

/* ===== Web App Handler ===== */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'track') {
    return handleTrackRequest(e);
  }
  return handleRequest(e);
}
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var sheet = ss.getSheetByName(ORDER_SHEET);
  var params = e ? e.parameter : {};

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatHeader(sheet);
  }

  var qty = parseInt(params.quantity) || 1;
  var price = parseInt(params.price) || 0;
  var deliveryCharge = parseInt(params.delivery_charge) || 0;
  var total = (price * qty) + deliveryCharge;

  var row = [
    new Date(),
    params.name || '',
    params.phone || '',
    params.whatsapp || '',
    params.address || '',
    params.delivery_area || '',
    deliveryCharge,
    params.payment_method || 'COD',
    params.product || '',
    params.size || '',
    qty,
    price,
    params.note || '',
    total,
    '⏳ পেন্ডিং',
    '',
    params.order_id || ''
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
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== Track Order (JSONP-ready) ===== */
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
      return createJsonOutput({
        found: true,
        order_id: data[i][16],
        name: data[i][1],
        phone: data[i][2],
        product: data[i][8],
        size: data[i][9],
        quantity: data[i][10],
        total: data[i][13],
        date: data[i][0],
        delivery_area: data[i][5],
        payment: data[i][7],
        address: data[i][4],
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

/* ===== Status Dropdown with Colors ===== */
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
    SpreadsheetApp.getUi().alert('✅ onEdit ট্রিগার সেটআপ হয়েছে!');
  } else {
    SpreadsheetApp.getUi().alert('ℹ️ ট্রিগার আগেই সেটআপ করা আছে।');
  }
}

/* ===== WhatsApp One-Click Link ===== */
function setWhatsAppLink(sheet, row) {
  if (row <= 1) return;
  var colB = 'B' + row;
  var colD = 'D' + row;
  var colE = 'E' + row;
  var colF = 'F' + row;
  var colH = 'H' + row;
  var colI = 'I' + row;
  var colJ = 'J' + row;
  var colK = 'K' + row;
  var colN = 'N' + row;
  var colQ = 'Q' + row;

  var formula = '=HYPERLINK("https://wa.me/880"&IF(LEFT(' + colD + ',1)="0",MID(' + colD + ',2,99),' + colD + ')&"?text="&ENCODEURL(' +
    '"প্রিয় "&' + colB + '&CHAR(10)&' +
    '"মৃন্ময়ী - Mrinmoyee"&CHAR(10)&' +
    '"📋 অর্ডার: "&' + colQ + '&CHAR(10)&CHAR(10)&' +
    '"ম্যাম/স্যার, আপনি কি অর্ডারটি কনফার্ম করতে চাচ্ছেন?"&CHAR(10)&CHAR(10)&' +
    '"📋 অর্ডার বিস্তারিত:"&CHAR(10)&' +
    '"🆔 অর্ডার: "&' + colQ + '&CHAR(10)&' +
    '"🛒 পণ্য: "&' + colI + '&" — "&' + colJ + '&" (x"&' + colK + '&")"&CHAR(10)&' +
    '"💰 মোট বিল: ৳"&' + colN + '&CHAR(10)&' +
    '"🚚 ডেলিভারি: "&' + colF + '&CHAR(10)&' +
    '"📍 ঠিকানা: "&' + colE + '&CHAR(10)&' +
    '"💳 পেমেন্ট: "&' + colH + '&CHAR(10)&CHAR(10)&' +
    '"ঠিকানা ও ডিজাইন ঠিক আছে? কনফার্ম করলে প্রসেসিং শুরু করব।"&CHAR(10)&' +
    '"ধন্যবাদ! 💛"' +
    '), "📲 WhatsApp")';

  sheet.getRange(row, WHATSAPP_COL).setFormula(formula);
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
  while (dash.getMaxRows() > 35) { dash.deleteRow(dash.getMaxRows()); }
  buildDashboard(dash, orderSheet);
}

function buildDashboard(dash, orderSheet) {
  var allData = orderSheet.getDataRange().getValues();
  // Index: 0=সময়, 1=নাম, 2=মোবাইল, 3=হোয়াটসঅ্যাপ, 4=ঠিকানা, 5=ডেলিভারি এরিয়া,
  // 6=ডেলিভারি চার্জ, 7=পেমেন্ট, 8=প্রোডাক্ট, 9=সাইজ, 10=পরিমাণ, 11=মূল্য,
  // 12=নোট, 13=নেট টোটাল, 14=স্ট্যাটাস, 15=WhatsApp
  var rows = [];
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][1]) rows.push(allData[i]);
  }
  var n = rows.length;

  // Title
  dash.getRange('A1:F1').merge();
  dash.getRange('A1').setValue('📊 মৃন্ময়ী - অর্ডার ড্যাশবোর্ড')
    .setFontSize(18).setFontWeight('bold').setFontColor('#c0392b')
    .setHorizontalAlignment('center').setBackground('#fdf8f4');
  dash.setRowHeight(1, 40);

  var today = new Date(); today.setHours(0,0,0,0);
  var todayOrders = 0;
  var thisMonth = 0;
  var pending = 0;
  var totalRevenue = 0;
  var productCount = {};

  for (var r = 0; r < rows.length; r++) {
    var rowDate = new Date(rows[r][0]);
    rowDate.setHours(0,0,0,0);
    if (rowDate.getTime() === today.getTime()) todayOrders++;
    if (rowDate.getMonth() === today.getMonth()) thisMonth++;
    if (rows[r][14] === '⏳ পেন্ডিং') pending++;
    totalRevenue += parseInt(rows[r][13]) || 0;
    var pName = rows[r][8] || 'অজানা';
    productCount[pName] = (productCount[pName] || 0) + (parseInt(rows[r][10]) || 1);
  }

  var firstDay = rows.length > 0 ? new Date(rows[0][0]) : new Date();
  var daysDiff = Math.max(1, Math.ceil((new Date().getTime() - firstDay.getTime()) / (1000*86400)));

  var cards = [
    ['📦 মোট অর্ডার', n, '#c0392b'],
    ['💰 নেট আয় (৳)', totalRevenue.toLocaleString('bn-IN'), '#27ae60'],
    ['🕐 আজকের', todayOrders, '#2980b9'],
    ['📅 এই মাসের', thisMonth, '#8e44ad'],
    ['⏳ পেন্ডিং', pending, '#e67e22'],
    ['📈 গড়/দিন', n > 0 ? (n/daysDiff).toFixed(1) : '0', '#d4a853']
  ];

  for (var ci = 0; ci < cards.length; ci++) {
    var col = ci < 3 ? 'A' : 'D';
    var crow = (ci < 3 ? ci : (ci-3)) + 3;
    dash.getRange(col + crow).setValue(cards[ci][0]).setFontSize(10).setFontColor('#7f6b5e');
    dash.getRange(col + crow).offset(0,1).setValue(cards[ci][1] + '').setFontSize(24).setFontWeight('bold').setFontColor(cards[ci][2]);
    dash.getRange(col + crow + ':' + String.fromCharCode(col.charCodeAt(0)+1) + crow).merge().setBackground('#fff')
      .setBorder(true, true, true, true, null, null, '#eee5dd', SpreadsheetApp.BorderStyle.SOLID);
    dash.setRowHeight(crow, 55);
  }

  // Top Products
  var topStart = 11;
  dash.getRange('A' + topStart + ':F' + topStart).merge();
  dash.getRange('A' + topStart).setValue('🏆 জনপ্রিয় প্রোডাক্ট')
    .setFontSize(14).setFontWeight('bold').setFontColor('#2d1b0e').setBackground('#f0e4d9');

  var sortedProducts = Object.entries(productCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8);

  var dashHeaders = [['A','#'],['B:C','প্রোডাক্ট'],['D','বিক্রি'],['E:F','আয় (৳)']];
  for (var hi = 0; hi < dashHeaders.length; hi++) {
    dash.getRange(dashHeaders[hi][0] + (topStart+1)).setValue(dashHeaders[hi][1])
      .setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  }

  for (var pi = 0; pi < sortedProducts.length; pi++) {
    var pr = topStart + 2 + pi;
    var productName = sortedProducts[pi][0];
    var productQty = sortedProducts[pi][1];
    var productRevenue = 0;
    for (var ri = 0; ri < rows.length; ri++) {
      if (rows[ri][8] === productName) productRevenue += parseInt(rows[ri][13]) || 0;
    }
    dash.getRange('A' + pr).setValue(pi+1).setHorizontalAlignment('center');
    dash.getRange('B' + pr + ':C' + pr).merge().setValue(productName).setFontSize(10);
    dash.getRange('D' + pr).setValue(productQty).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('E' + pr + ':F' + pr).merge().setValue(productRevenue)
      .setHorizontalAlignment('right').setFontColor('#27ae60').setFontWeight('bold');
    dash.getRange('A' + pr + ':F' + pr)
      .setBorder(true, true, true, true, null, null, '#eee5dd', SpreadsheetApp.BorderStyle.SOLID)
      .setBackground(pi%2===0?'#fdf8f4':'#fff');
  }

  // 7-day trend
  var trendStart = topStart + 2 + Math.min(sortedProducts.length, 8) + 1;
  dash.getRange('A' + trendStart + ':F' + trendStart).merge();
  dash.getRange('A' + trendStart).setValue('📆 গত ৭ দিনের অর্ডার')
    .setFontSize(14).setFontWeight('bold').setFontColor('#2d1b0e').setBackground('#f0e4d9');

  var dayKeys = [];
  var dayValues = {};
  for (var di = 6; di >= 0; di--) {
    var d = new Date(today);
    d.setDate(d.getDate() - di);
    var key = d.toLocaleDateString('bn-BD', {day:'numeric',month:'short'});
    dayKeys.push(key);
    dayValues[key] = 0;
  }
  for (var ri2 = 0; ri2 < rows.length; ri2++) {
    var d2 = new Date(rows[ri2][0]);
    var key2 = d2.toLocaleDateString('bn-BD', {day:'numeric',month:'short'});
    if (dayValues[key2] !== undefined) dayValues[key2]++;
  }

  dash.getRange('A' + (trendStart+1)).setValue('তারিখ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  dash.getRange('B' + (trendStart+1) + ':E' + (trendStart+1)).merge().setValue('গ্রাফ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  dash.getRange('F' + (trendStart+1)).setValue('অর্ডার').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');

  for (var tdi = 0; tdi < dayKeys.length; tdi++) {
    var tr = trendStart + 2 + tdi;
    var val = dayValues[dayKeys[tdi]];
    dash.getRange('A' + tr).setValue(dayKeys[tdi]);
    dash.getRange('B' + tr + ':E' + tr).merge();
    var bar = '';
    for (var bi = 0; bi < Math.min(val, 10); bi++) bar += '█';
    for (var bj = 0; bj < Math.max(0, 10 - val); bj++) bar += '░';
    dash.getRange('B' + tr + ':E' + tr).setValue(bar).setFontFamily('Courier New').setFontSize(12)
      .setFontColor(val > 0 ? '#27ae60' : '#ddd5cc');
    dash.getRange('F' + tr).setValue(val).setHorizontalAlignment('center').setFontWeight('bold');
    dash.getRange('A' + tr + ':F' + tr)
      .setBorder(true, true, true, true, null, null, '#eee5dd', SpreadsheetApp.BorderStyle.SOLID);
  }

  dash.autoResizeColumns(1, 6);
  dash.setColumnWidth(2, 200);
}
```

4. **Deploy > New deployment** > Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**
5. **ওয়েব অ্যাপের URL** কপি করে `index.html` ফাইলে `YOUR_GOOGLE_APPS_SCRIPT_ID` জায়গায় বসান

> **⚠️ পুরনো ডেটা থাকলে:** এই ভার্সনে কলাম的结构 বদলেছে। আগের শীট থাকলে **নতুন শীট তৈরি** করে সেটআপ করুন, অথবা আগের শীটের ডেটা ব্যাকআপ নিয়ে কলাম এডিট করে নিন।

### স্ট্যাটাস ড্রপডাউন + WhatsApp লিংক সেটআপ

প্রথমবার ডিপ্লয়ের পর **একবার** `setupTrigger()` ফাংশন রান করান:
1. Apps Script এডিটরে **Execute > Run function > setupTrigger** সিলেক্ট করুন
2. অনুমতি দিলে automatically `onEdit` ট্রিগার সেট হবে
3. এর পর থেকে শীটে স্ট্যাটাস পরিবর্তন করলেই অটো কালার হয়ে যাবে

### WhatsApp One-Click Send

শীটের **WhatsApp লিংক** কলামে ক্লিক করলেই WhatsApp ওপেন হবে কনফার্মেশন মেসেজ সহ:
```
প্রিয় [নাম],
মৃন্ময়ী - Mrinmoyee
📋 অর্ডার: [অর্ডার নং]

ম্যাম/স্যার, আপনি কি অর্ডারটি কনফার্ম করতে চাচ্ছেন?

📋 অর্ডার বিস্তারিত:
🆔 অর্ডার: [অর্ডার নং]
🛒 পণ্য: [প্রোডাক্ট] — [সাইজ] (x[পরিমাণ])
💰 মোট বিল: ৳[টোটাল]
🚚 ডেলিভারি: [এরিয়া]
📍 ঠিকানা: [ঠিকানা]
💳 পেমেন্ট: [পেমেন্ট]

ঠিকানা ও ডিজাইন ঠিক আছে? কনফার্ম করলে প্রসেসিং শুরু করব।
ধন্যবাদ! 💛
```

---

## ৩. Facebook Pixel সেটআপ

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

## ৪. Messenger Chatbot (অটো রিপ্লাই)

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

## ৫. ফাইল লিস্ট

| ফাইল | কী করে |
|------|--------|
| `index.html` | মূল ওয়েবপেজ (সব কন্টেন্ট) |
| `style.css` | ডিজাইন ও রেসপন্সিভ স্টাইল |
| `script.js` | প্রোডাক্ট রেন্ডার, ফিল্টার, অর্ডার ফর্ম |
| `images/` | প্রোডাক্টের ছবি রাখার ফোল্ডার |

---

## ৬. প্রোডাক্ট ছবি যোগ করা

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

**কোনো ধাপে আটকালে জানাবেন, আমি সাহায্য করব!**
