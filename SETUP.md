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
// মৃন্ময়ী - অর্ডার ম্যানেজমেন্ট সিস্টেম v2 (মূল্য+ডিসকাউন্ট+ডেলিভারি সহ)

const হেডার = ['সময়', 'নাম', 'মোবাইল', 'ঠিকানা', 'প্রোডাক্ট', 'সাইজ', 'পরিমাণ', 'মূল্য', 'ডিসকাউন্ট', 'ডেলিভারি চার্জ', 'নেট টোটাল', 'নোট', 'স্ট্যাটাস'];
const ড্যাশবোর্ড_শীট = '📊 সারাংশ';
const অর্ডার_শীট = '📦 অর্ডার';

/* ===== অন ওপেন — কাস্টম মেনু ===== */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 মৃন্ময়ী')
    .addItem('⏳ শুধু পেন্ডিং দেখান', 'ফিল্টার_পেন্ডিং')
    .addItem('✅ ডান দেখান', 'ফিল্টার_ডান')
    .addItem('🔄 সব দেখান', 'ফিল্টার_সব')
    .addSeparator()
    .addItem('✓ সিলেক্টেড অর্ডার ডান করুন', 'ডান_করুন')
    .addItem('📊 ড্যাশবোর্ড রিফ্রেশ', 'রিফ্রেশ_ড্যাশবোর্ড')
    .addToUi();
}

/* ===== ওয়েব অ্যাপ হ্যান্ডলার ===== */
function doGet(e) { return হ্যান্ডেল_করুন(e); }
function doPost(e) { return হ্যান্ডেল_করুন(e); }

function হ্যান্ডেল_করুন(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  শীট_নিশ্চিত_করুন(ss);
  const শীট = ss.getSheetByName(অর্ডার_শীট);
  const params = e ? e.parameter : {};

  if (শীট.getLastRow() === 0) {
    শীট.appendRow(হেডার);
    হেডার_ফরম্যাট(শীট);
    ফিল্টার_সেটআপ(শীট);
  }

  const qty = parseInt(params.quantity) || 1;
  const price = parseInt(params.price) || 0;
  const discount = parseInt(params.discount) || 0;
  const delivery = parseInt(params.delivery) || 0;
  const total = (price * qty) - discount + delivery;

  const সারি = [
    new Date(),
    params.name || '',
    params.phone || '',
    params.address || '',
    params.product || '',
    params.size || '',
    qty,
    price,
    discount,
    delivery,
    total,
    params.note || '',
    '⏳ পেন্ডিং'
  ];
  শীট.appendRow(সারি);
  সারি_ফরম্যাট(শীট, শীট.getLastRow());
  ড্যাশবোর্ড_আপডেট(ss);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== ফিল্টার ===== */
function ফিল্টার_পেন্ডিং() {
  const শীট = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(অর্ডার_শীট);
  if (!শীট || শীট.getLastRow() < 1) return;
  শীট.getFilter()?.remove();
  const রেঞ্জ = শীট.getRange(1, 1, শীট.getLastRow(), 13);
  const ফিল্টার = রেঞ্জ.createFilter();
  ফিল্টার.setColumnFilterCriteria(13, SpreadsheetApp.newFilterCriteria()
    .setVisibleValues(['⏳ পেন্ডিং']).build());
}

function ফিল্টার_ডান() {
  const শীট = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(অর্ডার_শীট);
  if (!শীট || শীট.getLastRow() < 1) return;
  শীট.getFilter()?.remove();
  const রেঞ্জ = শীট.getRange(1, 1, শীট.getLastRow(), 13);
  const ফিল্টার = রেঞ্জ.createFilter();
  ফিল্টার.setColumnFilterCriteria(13, SpreadsheetApp.newFilterCriteria()
    .setVisibleValues(['✅ ডান']).build());
}

function ফিল্টার_সব() {
  const শীট = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(অর্ডার_শীট);
  if (!শীট) return;
  শীট.getFilter()?.remove();
}

function ফিল্টার_সেটআপ(শীট) {
  if (শীট.getLastRow() < 2) return;
  শীট.getFilter()?.remove();
  const রেঞ্জ = শীট.getRange(1, 1, শীট.getLastRow(), 13);
  const ফিল্টার = রেঞ্জ.createFilter();
  ফিল্টার.setColumnFilterCriteria(13, SpreadsheetApp.newFilterCriteria()
    .setVisibleValues(['⏳ পেন্ডিং']).build());
}

/* ===== ডান করুন ===== */
function ডান_করুন() {
  const শীট = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(অর্ডার_শীট);
  if (!শীট) return;
  const সারি = শীট.getActiveRange()?.getRow();
  if (!সারি || সারি <= 1) return;
  শীট.getRange(সারি, 13).setValue('✅ ডান');
  শীট.getRange(সারি, 13).setBackground('#d5f5e3').setFontColor('#27ae60');
  রিফ্রেশ_ড্যাশবোর্ড();
}

function রিফ্রেশ_ড্যাশবোর্ড() {
  ড্যাশবোর্ড_আপডেট(SpreadsheetApp.getActiveSpreadsheet());
}

/* ===== শীট সেটআপ ===== */
function শীট_নিশ্চিত_করুন(ss) {
  [অর্ডার_শীট, ড্যাশবোর্ড_শীট].forEach(নাম => {
    if (!ss.getSheetByName(নাম)) ss.insertSheet(নাম);
  });
}

function হেডার_ফরম্যাট(শ) {
  const রেঞ্জ = শ.getRange(1, 1, 1, 13);
  রেঞ্জ.setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#a93226', SpreadsheetApp.BorderStyle.SOLID);
  শ.setFrozenRows(1);
}

function সারি_ফরম্যাট(শ, লাইন) {
  শ.getRange(লাইন, 1, 1, 13)
    .setBorder(true, true, true, true, null, null, '#ddd5cc', SpreadsheetApp.BorderStyle.SOLID);
  শ.autoResizeColumns(1, 13);
}

/* ===== ড্যাশবোর্ড ===== */
function ড্যাশবোর্ড_আপডেট(ss) {
  const ড্যাশ = ss.getSheetByName(ড্যাশবোর্ড_শীট);
  const অর্ডার = ss.getSheetByName(অর্ডার_শীট);
  if (!ড্যাশ || !অর্ডার) return;
  ড্যাশ.clear();
  ড্যাশ.getRange(1, 1, ড্যাশ.getMaxRows(), ড্যাশ.getMaxColumns()).breakApart();
  while (ড্যাশ.getMaxRows() > 35) { ড্যাশ.deleteRow(ড্যাশ.getMaxRows()); }
  ড্যাশডিজাইন_প্রয়োগ(ড্যাশ, অর্ডার);
}

function ড্যাশডিজাইন_প্রয়োগ(ড্যাশ, অর্ডারশীট) {
  const সব = অর্ডারশীট.getDataRange().getValues();
  const রows = সব.filter((r, i) => i > 0 && r[1]);
  const n = রows.length;

  ড্যাশ.getRange('A1:F1').merge();
  ড্যাশ.getRange('A1').setValue('📊 মৃন্ময়ী - অর্ডার ড্যাশবোর্ড')
    .setFontSize(18).setFontWeight('bold').setFontColor('#c0392b')
    .setHorizontalAlignment('center').setBackground('#fdf8f4');
  ড্যাশ.setRowHeight(1, 40);

  const আজ = new Date(); আজ.setHours(0,0,0,0);
  const আজকে = রows.filter(r => new Date(r[0]).setHours(0,0,0,0) === আজ.getTime());
  const এইমাস = রows.filter(r => new Date(r[0]).getMonth() === আজ.getMonth());
  const পেন্ডিং = রows.filter(r => r[12] === '⏳ পেন্ডিং');
  const মোটটাকা = রows.reduce((s, r) => s + (parseInt(r[10])||0), 0);
  const প্রথমদিন = রows.length > 0 ? new Date(রows[0][0]) : new Date();
  const দিনdiff = Math.max(1, Math.ceil((new Date() - প্রথমদিন) / (1000*86400)));

  const কার্ড = [
    ['📦 মোট অর্ডার', n, '#c0392b'],
    ['💰 নেট আয় (৳)', মোটটাকা.toLocaleString('bn-IN'), '#27ae60'],
    ['🕐 আজকের', আজকে.length, '#2980b9'],
    ['📅 এই মাসের', এইমাস.length, '#8e44ad'],
    ['⏳ পেন্ডিং', পেন্ডিং.length, '#e67e22'],
    ['📈 গড়/দিন', n > 0 ? (n/দিনdiff).toFixed(1) : '0', '#d4a853']
  ];

  কার্ড.forEach((c, i) => {
    const কল = i < 3 ? 'A' : 'D';
    const ল = i < 3 ? (i+3) : (i-2);
    ড্যাশ.getRange(`${কল}${ল}`).setValue(c[0]).setFontSize(10).setFontColor('#7f6b5e');
    ড্যাশ.getRange(`${কল}${ল}`).offset(0,1).setValue(c[1])
      .setFontSize(24).setFontWeight('bold').setFontColor(c[2]);
    ড্যাশ.getRange(`${কল}${ল}:${String.fromCharCode(কল.charCodeAt(0)+1)}${ল}`)
      .merge().setBackground('#fff')
      .setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
    ড্যাশ.setRowHeight(ল, 55);
  });

  // টপ প্রোডাক্ট
  const টপস্টার্ট = 11;
  ড্যাশ.getRange(`A${টপস্টার্ট}:F${টপস্টার্ট}`).merge();
  ড্যাশ.getRange(`A${টপস্টার্ট}`).setValue('🏆 জনপ্রিয় প্রোডাক্ট')
    .setFontSize(14).setFontWeight('bold').setFontColor('#2d1b0e').setBackground('#f0e4d9');

  const কাউন্ট = {};
  রows.forEach(r => {
    const পি = r[4]||'অজানা'; কাউন্ট[পি] = (কাউন্ট[পি]||0)+(parseInt(r[6])||1);
  });
  const টপ = Object.entries(কাউন্ট).sort((a,b) => b[1]-a[1]).slice(0,8);

  [['A','#'],['B:C','প্রোডাক্ট'],['D','বিক্রি'],['E:F','আয় (৳)']].forEach(([কল,টেক্সট]) => {
    ড্যাশ.getRange(`${কল}${টপস্টার্ট+1}`).setValue(টেক্সট)
      .setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  });

  টপ.forEach(([নাম, ক], i) => {
    const ল = টপস্টার্ট+2+i;
    ড্যাশ.getRange(`A${ল}`).setValue(i+1).setHorizontalAlignment('center');
    ড্যাশ.getRange(`B${ল}:C${ল}`).merge().setValue(নাম).setFontSize(10);
    ড্যাশ.getRange(`D${ল}`).setValue(ক).setHorizontalAlignment('center').setFontWeight('bold');
    ড্যাশ.getRange(`E${ল}:F${ল}`).merge()
      .setValue(রows.filter(r => r[4]===নাম).reduce((s,r)=>s+(parseInt(r[10])||0),0))
      .setHorizontalAlignment('right').setFontColor('#27ae60').setFontWeight('bold');
    ড্যাশ.getRange(`A${ল}:F${ল}`)
      .setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID)
      .setBackground(i%2===0?'#fdf8f4':'#fff');
  });

  // ৭ দিনের ট্রেন্ড
  const শেষ = টপস্টার্ট+2+Math.min(টপ.length,8)+1;
  ড্যাশ.getRange(`A${শেষ}:F${শেষ}`).merge();
  ড্যাশ.getRange(`A${শেষ}`).setValue('📆 গত ৭ দিনের অর্ডার')
    .setFontSize(14).setFontWeight('bold').setFontColor('#2d1b0e').setBackground('#f0e4d9');

  const দিনলিপি = {};
  for (let i=6; i>=0; i--) {
    const d = new Date(আজ); d.setDate(d.getDate()-i);
    দিনলিপি[d.toLocaleDateString('bn-BD',{day:'numeric',month:'short'})] = 0;
  }
  রows.forEach(r => {
    const d = new Date(r[0]);
    const কী = d.toLocaleDateString('bn-BD',{day:'numeric',month:'short'});
    if (দিনলিপি[কী]!==undefined) দিনলিপি[কী]++;
  });

  ড্যাশ.getRange(`A${শেষ+1}`).setValue('তারিখ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  ড্যাশ.getRange(`B${শেষ+1}:E${শেষ+1}`).merge().setValue('গ্রাফ').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');
  ড্যাশ.getRange(`F${শেষ+1}`).setValue('অর্ডার').setBackground('#c0392b').setFontColor('#fff').setFontWeight('bold');

  Object.entries(দিনলিপি).forEach(([দিন, ক], i) => {
    const ল = শেষ+2+i;
    ড্যাশ.getRange(`A${ল}`).setValue(দিন);
    ড্যাশ.getRange(`B${ল}:E${ল}`).merge();
    const বার = '█'.repeat(ক) + '░'.repeat(Math.max(0,10-ক));
    ড্যাশ.getRange(`B${ল}:E${ল}`).setValue(বার).setFontFamily('Courier New').setFontSize(12)
      .setFontColor(ক>0?'#27ae60':'#ddd5cc');
    ড্যাশ.getRange(`F${ল}`).setValue(ক).setHorizontalAlignment('center').setFontWeight('bold');
    ড্যাশ.getRange(`A${ল}:F${ল}`)
      .setBorder(true,true,true,true,null,null,'#eee5dd',SpreadsheetApp.BorderStyle.SOLID);
  });

  ড্যাশ.autoResizeColumns(1,6);
  ড্যাশ.setColumnWidth(2, 200);
}
```

4. **Deploy > New deployment** > Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**
5. **ওয়েব অ্যাপের URL** কপি করে `index.html` ফাইলে `YOUR_GOOGLE_APPS_SCRIPT_ID` জায়গায় বসান

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
