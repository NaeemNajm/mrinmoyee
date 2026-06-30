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
3. নিচের কোড কপি-পেস্ট করুন এবং **Save** করুন:

```javascript
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  const row = [
    new Date(),
    e.parameter.name || '',
    e.parameter.phone || '',
    e.parameter.address || '',
    e.parameter.product || '',
    e.parameter.size || '',
    e.parameter.quantity || '1',
    e.parameter.note || ''
  ];

  sheet.appendRow(row);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
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
