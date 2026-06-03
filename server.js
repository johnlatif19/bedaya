require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// ========== Firebase Initialization ==========
let db;
try {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`
    });
  }
  
  db = admin.firestore();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ========== NEW PROFESSIONAL EMAIL TEMPLATES ==========

// Main email wrapper with modern medical/premium design
function createPremiumEmailTemplate(title, content, userName = '', type = 'general') {
  const logoUrl = 'https://i.postimg.cc/PqYGJKTd/Logo.jpg';
  
  // Different colors based on email type
  const colors = {
    booking: { primary: '#6366f1', secondary: '#10b981', accent: '#818cf8' },
    inquiry: { primary: '#6366f1', secondary: '#10b981', accent: '#818cf8' },
    result: { primary: '#6366f1', secondary: '#10b981', accent: '#818cf8' },
    password: { primary: '#6366f1', secondary: '#10b981', accent: '#818cf8' },
    general: { primary: '#6366f1', secondary: '#10b981', accent: '#818cf8' }
  };
  
  const colorSet = colors[type] || colors.general;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
          margin: 0;
          padding: 20px;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Header with Gradient */
        .email-header {
          background: linear-gradient(135deg, ${colorSet.primary} 0%, ${colorSet.secondary} 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        
        .email-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') repeat-x bottom;
          background-size: cover;
          opacity: 0.15;
        }
        
        .logo-wrapper {
          position: relative;
          z-index: 2;
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          border: 3px solid rgba(255, 255, 255, 0.5);
        }
        
        .logo-wrapper img {
          width: 85px;
          height: 85px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .email-header h1 {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .email-header p {
          color: rgba(255, 255, 255, 0.95);
          font-size: 14px;
          position: relative;
          z-index: 2;
        }
        
        /* Content Area */
        .email-content {
          padding: 40px 35px;
          background: white;
        }
        
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .greeting-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, ${colorSet.primary}, ${colorSet.secondary});
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }
        
        .message-text {
          color: #4b5563;
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 25px;
        }
        
        /* Info Cards */
        .info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 20px;
          margin: 25px 0;
          border-right: 4px solid ${colorSet.primary};
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-row {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          width: 100px;
          font-weight: 600;
          color: ${colorSet.primary};
          font-size: 14px;
        }
        
        .info-value {
          flex: 1;
          color: #334155;
          font-size: 14px;
        }
        
        /* Message Box */
        .message-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 16px;
          padding: 20px;
          margin: 20px 0;
          border-right: 4px solid ${colorSet.secondary};
        }
        
        .message-box p {
          color: #166534;
          margin: 0;
          line-height: 1.8;
        }
        
        /* CTA Button */
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, ${colorSet.primary}, ${colorSet.secondary});
          color: white;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 600;
          margin: 20px 0 10px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        
        /* Footer */
        .email-footer {
          background: #1f2937;
          padding: 30px;
          text-align: center;
        }
        
        .social-links {
          margin-bottom: 20px;
        }
        
        .social-links a {
          color: #9ca3af;
          margin: 0 10px;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .social-links a:hover {
          color: ${colorSet.primary};
        }
        
        .footer-text {
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.6;
        }
        
        .footer-text strong {
          color: #e5e7eb;
        }
        
        .copyright {
          color: #6b7280;
          font-size: 11px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #374151;
        }
        
        @media (max-width: 600px) {
          .email-content {
            padding: 25px 20px;
          }
          .info-label {
            width: 80px;
            font-size: 12px;
          }
          .greeting {
            font-size: 18px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with Logo -->
        <div class="email-header">
          <div class="logo-wrapper">
            <img src="${logoUrl}" alt="مركز بداية">
          </div>
          <h1>${title}</h1>
          <p>مركز بداية للتدخل المبكر والتأهيل</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
          ${userName ? `
          <div class="greeting">
            <span class="greeting-icon">👋</span>
            <span>مرحباً ${userName}</span>
          </div>
          ` : `
          <div class="greeting">
            <span class="greeting-icon">✨</span>
            <span>السلام عليكم ورحمة الله</span>
          </div>
          `}
          
          <div class="message-text">
            ${content}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
          <div class="social-links">
            <a href="https://wa.me/201278127159" style="display: inline-block; margin: 0 8px;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="24" height="24" alt="WhatsApp" style="opacity: 0.7;">
            </a>
            <a href="tel:01278127159" style="display: inline-block; margin: 0 8px;">
              <img src="https://cdn-icons-png.flaticon.com/512/724/724664.png" width="24" height="24" alt="Phone" style="opacity: 0.7;">
            </a>
          </div>
          <div class="footer-text">
            <strong>📍 العنوان</strong><br>
            ٢٩ شارع سلطان ابو العلا، العروبة، امبابة
          </div>
          <div class="footer-text" style="margin-top: 12px;">
            <strong>📞 للتواصل</strong><br>
            01278127159
          </div>
          <div class="copyright">
            © 2025 مركز بداية للتدخل المبكر والتأهيل<br>
            جميع الحقوق محفوظة
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign({ user, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, process.env.SESSION_SECRET);
}

// Auth middleware
async function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'غير مصرح بالوصول', details: 'لم يتم توفير توكن' });
  }

  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'غير مصرح بالوصول', details: 'توكن غير صالح أو منتهي الصلاحية' });
    }
    req.user = decoded.user;
    next();
  });
}

// ========== Routes ========== //

// Submit user data
app.post('/api/submit', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'الرجاء ملء جميع الحقول' });
  }
  
  try {
    await db.collection('users').add({ name, email, phone, receivedAt: new Date().toISOString() });
    res.json({ message: 'تم استلام البيانات بنجاح' });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'حدث خطأ في حفظ البيانات' });
  }
});

// Contact message (Inquiry Email)
app.post('/api/message', async (req, res) => {
  const { name, email, message, phone } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'الاسم والإيميل والرسالة مطلوبة' });
  }

  try {
    const emailContent = `
      <div class="message-box">
        <p style="font-size: 16px; font-weight: 500; margin-bottom: 12px;">📝 محتوى الرسالة:</p>
        <p style="font-size: 15px; line-height: 1.7;">${message}</p>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">👤 الاسم:</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📧 البريد الإلكتروني:</span>
          <span class="info-value">${email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 رقم الهاتف:</span>
          <span class="info-value">${phone || 'غير مدخل'}</span>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"مركز بداية" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `📨 رسالة جديدة من ${name} - مركز بداية`,
      html: createPremiumEmailTemplate('📨 رسالة جديدة من عميل', emailContent, name, 'inquiry')
    });

    await db.collection('adminMessages').add({ email, message, name, phone: phone || null, sentAt: new Date().toISOString() });
    res.json({ message: 'تم إرسال الرسالة بنجاح' });
  } catch (err) {
    console.error('خطأ في إرسال الرسالة:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إرسال الرسالة' });
  }
});

// Booking appointment
app.post('/api/booking', async (req, res) => {
  const { name, phone, date, time } = req.body;
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  
  try {
    await db.collection('bookings').add({ name, phone, date, time, receivedAt: new Date().toISOString() });

    // Send confirmation email to admin
    const adminEmailContent = `
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">👤 الاسم:</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 الهاتف:</span>
          <span class="info-value">${phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 التاريخ:</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">⏰ الوقت:</span>
          <span class="info-value">${time}</span>
        </div>
      </div>
      <div class="message-box">
        <p>✅ تم استلام طلب الحجز بنجاح. سيتم التواصل مع العميل لتأكيد الموعد.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"مركز بداية" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `📅 حجز جديد من ${name} - ${date}`,
      html: createPremiumEmailTemplate('📅 حجز جديد في النظام', adminEmailContent, name, 'booking')
    });

    // Send confirmation to customer
    const customerEmailContent = `
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">📅 التاريخ:</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">⏰ الوقت:</span>
          <span class="info-value">${time}</span>
        </div>
      </div>
      <div class="message-box">
        <p>🔔 نذكركم بالالتزام بالموعد المحدد.</p>
        <p>📍 العنوان: ٢٩ شارع سلطان ابو العلا، العروبة، امبابة</p>
        <p>📞 للاستفسار: 01278127159</p>
        <p>💡 يرجى إحضار التقارير السابقة إن وجدت.</p>
      </div>
    `;

    // Note: In production, you would send to customer's email
    // For now, sending to admin as well, but you can add customer email field
    if (req.body.email) {
      await transporter.sendMail({
        from: `"مركز بداية" <${process.env.SMTP_USER}>`,
        to: req.body.email,
        subject: '✅ تأكيد حجز موعد - مركز بداية',
        html: createPremiumEmailTemplate('✅ تأكيد حجز موعد', customerEmailContent, name, 'booking')
      });
    }

    res.json({ message: 'تم استلام الحجز بنجاح' });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'حدث خطأ في حفظ الحجز' });
  }
});

// Upload result
app.post('/api/upload-result', upload.single('resultFile'), async (req, res) => {
  const { phone, email } = req.body;
  if (!phone || !req.file) {
    return res.status(400).json({ error: 'رقم الهاتف والملف مطلوبان' });
  }
  
  try {
    const fileUrl = '/uploads/' + req.file.filename;
    await db.collection('results').add({ phone, email: email || null, fileUrl, uploadedAt: new Date().toISOString() });
    
    // Send result upload notification email
    if (email) {
      const resultEmailContent = `
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">📱 رقم الهاتف:</span>
            <span class="info-value">${phone}</span>
          </div>
        </div>
        <div class="message-box">
          <p>📄 تم رفع نتيجة التقييم الخاصة بكم.</p>
          <p>يمكنكم الاطلاع على النتيجة من خلال رابط التحميل أدناه:</p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.BASE_URL || 'https://bedaya-center.vercel.app'}${fileUrl}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #10b981); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600;">
            📥 تحميل النتيجة
          </a>
        </div>
      `;
      
      await transporter.sendMail({
        from: `"مركز بداية" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '📄 نتيجة التقييم - مركز بداية',
        html: createPremiumEmailTemplate('📄 نتيجة التقييم', resultEmailContent, '', 'result')
      });
    }
    
    res.json({ message: 'تم رفع النتيجة بنجاح', fileUrl });
  } catch (error) {
    console.error('Error uploading result:', error);
    res.status(500).json({ error: 'حدث خطأ في رفع النتيجة' });
  }
});

// Search for result
app.get('/api/results/:phone', async (req, res) => {
  const phone = req.params.phone;
  try {
    const snapshot = await db.collection('results').where('phone', '==', phone).get();
    const results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    
    if (results.length > 0) {
      res.json({ success: true, results });
    } else {
      res.status(404).json({ success: false, message: 'لا توجد نتائج لهذا الرقم' });
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'حدث خطأ في البحث' });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = generateToken({ username });
    res.json({ message: 'تم تسجيل الدخول بنجاح', token });
  } else {
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
});

// Verify token
app.get('/api/admin/verify-token', checkAuth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Logout
app.post('/api/admin/logout', checkAuth, (req, res) => {
  res.json({ message: 'تم تسجيل الخروج بنجاح', logoutTime: new Date().toISOString() });
});

// Sales system
app.post('/api/admin/sales', checkAuth, async (req, res) => {
  const { customerName, amount } = req.body;
  if (!customerName || !amount || isNaN(amount)) {
    return res.status(400).json({ error: 'اسم العميل ومبلغ البيع (رقم) مطلوبان' });
  }
  try {
    const newSale = { id: Date.now().toString(), customerName, amount: parseFloat(amount), saleTime: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.collection('sales').doc(newSale.id).set(newSale);
    res.status(201).json({ message: 'تم تسجيل عملية البيع بنجاح', sale: newSale });
  } catch (error) {
    console.error('Error saving sale:', error);
    res.status(500).json({ error: 'حدث خطأ في تسجيل البيع' });
  }
});

app.get('/api/admin/sales/today', checkAuth, async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    const snapshot = await db.collection('sales').where('saleTime', '>=', todayStart).where('saleTime', '<=', todayEnd).get();
    const todaySales = [];
    let todayTotal = 0;
    snapshot.forEach(doc => { const sale = doc.data(); todaySales.push(sale); todayTotal += sale.amount; });
    res.json({ sales: todaySales, todayTotal });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب المبيعات' });
  }
});

app.put('/api/admin/sale/:id', checkAuth, async (req, res) => {
  const saleId = req.params.id;
  const { customerName, amount } = req.body;
  if (!customerName || !amount || isNaN(amount)) {
    return res.status(400).json({ error: 'اسم العميل ومبلغ البيع (رقم) مطلوبان' });
  }
  try {
    const saleRef = db.collection('sales').doc(saleId);
    const saleDoc = await saleRef.get();
    if (!saleDoc.exists) return res.status(404).json({ error: 'عملية البيع غير موجودة' });
    const updatedSale = { ...saleDoc.data(), customerName, amount: parseFloat(amount), updatedAt: new Date().toISOString() };
    await saleRef.update(updatedSale);
    res.json({ message: 'تم تحديث عملية البيع بنجاح', sale: updatedSale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'حدث خطأ في تحديث البيع' });
  }
});

app.delete('/api/admin/sale/:id', checkAuth, async (req, res) => {
  const saleId = req.params.id;
  try {
    const saleRef = db.collection('sales').doc(saleId);
    const saleDoc = await saleRef.get();
    if (!saleDoc.exists) return res.status(404).json({ error: 'عملية البيع غير موجودة' });
    await saleRef.delete();
    res.json({ message: 'تم حذف عملية البيع بنجاح' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف البيع' });
  }
});

// Users, Bookings, Results, Messages routes
app.get('/api/admin/users', checkAuth, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const messagesSnapshot = await db.collection('adminMessages').get();
    const users = [];
    const messagesMap = new Map();
    messagesSnapshot.forEach(doc => {
      const msg = doc.data();
      if (!messagesMap.has(msg.email)) messagesMap.set(msg.email, []);
      messagesMap.get(msg.email).push(msg.message);
    });
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const userMessages = messagesMap.get(user.email) || [];
      users.push({ ...user, messages: userMessages.join('\n\n') || 'لا توجد رسائل' });
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب المستخدمين' });
  }
});

app.get('/api/admin/bookings', checkAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('bookings').get();
    const bookings = [];
    snapshot.forEach(doc => bookings.push({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب الحجوزات' });
  }
});

app.get('/api/admin/results', checkAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('results').get();
    const results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب النتائج' });
  }
});

app.delete('/api/admin/user/:email', checkAuth, async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  try {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ message: `تم حذف المستخدم ${email} بنجاح` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف المستخدم' });
  }
});

app.delete('/api/admin/booking/:phone', checkAuth, async (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  try {
    const snapshot = await db.collection('bookings').where('phone', '==', phone).get();
    if (snapshot.empty) return res.status(404).json({ error: 'الحجز غير موجود' });
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ message: `تم حذف الحجز لرقم ${phone} بنجاح` });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف الحجز' });
  }
});

app.put('/api/admin/result/:phone', upload.single('resultFile'), checkAuth, async (req, res) => {
  const oldPhone = decodeURIComponent(req.params.phone);
  const newPhone = req.body.phone;
  const resultFile = req.file;
  if (!newPhone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
  try {
    const snapshot = await db.collection('results').where('phone', '==', oldPhone).get();
    if (snapshot.empty) return res.status(404).json({ error: 'النتيجة غير موجودة' });
    const doc = snapshot.docs[0];
    const resultData = doc.data();
    if (resultFile && resultData.fileUrl) {
      const oldFilePath = path.join(__dirname, 'public', resultData.fileUrl);
      fs.unlink(oldFilePath, (err) => { if (err) console.error('فشل في حذف الملف القديم:', err); });
    }
    const updatedData = { phone: newPhone, updatedAt: new Date().toISOString() };
    if (resultFile) updatedData.fileUrl = '/uploads/' + resultFile.filename;
    else updatedData.fileUrl = resultData.fileUrl;
    await doc.ref.update(updatedData);
    res.json({ message: 'تم تحديث النتيجة بنجاح', result: { id: doc.id, ...resultData, ...updatedData } });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'حدث خطأ في تحديث النتيجة' });
  }
});

app.delete('/api/admin/result/:phone', checkAuth, async (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  try {
    const snapshot = await db.collection('results').where('phone', '==', phone).get();
    if (snapshot.empty) return res.status(404).json({ error: 'النتيجة غير موجودة' });
    const doc = snapshot.docs[0];
    const resultData = doc.data();
    if (resultData.fileUrl) {
      const filePath = path.join(__dirname, 'public', resultData.fileUrl);
      fs.unlink(filePath, (err) => { if (err) console.error('فشل في حذف الملف:', err); });
    }
    await doc.ref.delete();
    res.json({ message: `تم حذف النتيجة لرقم ${phone} بنجاح` });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف النتيجة' });
  }
});

app.post('/api/admin/message', checkAuth, async (req, res) => {
  const { email, message } = req.body;
  if (!email || !message?.trim()) {
    return res.status(400).json({ error: 'البريد الإلكتروني والرسالة مطلوبين' });
  }
  try {
    const emailContent = `
      <div class="message-box">
        <p style="font-size: 16px; line-height: 1.8;">${message}</p>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">📞 للتواصل:</span>
          <span class="info-value">01278127159</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 العنوان:</span>
          <span class="info-value">٢٩ شارع سلطان ابو العلا، العروبة، امبابة</span>
        </div>
      </div>
    `;
    await transporter.sendMail({
      from: `"مركز بداية" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '📬 رسالة من مركز بداية',
      html: createPremiumEmailTemplate('📬 رسالة من مركز بداية', emailContent, '', 'general')
    });
    await db.collection('adminMessages').add({ email, message, sentAt: new Date().toISOString() });
    res.json({ message: 'تم إرسال الرسالة بنجاح' });
  } catch (err) {
    console.error('خطأ في إرسال الإيميل:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إرسال الإيميل' });
  }
});

app.get('/api/admin/messages', checkAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('adminMessages').orderBy('sentAt', 'desc').get();
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب الرسائل' });
  }
});

app.delete('/api/admin/message/:id', checkAuth, async (req, res) => {
  const id = req.params.id;
  try {
    await db.collection('adminMessages').doc(id).delete();
    res.json({ message: 'تم حذف الرسالة بنجاح' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف الرسالة' });
  }
});

// Page routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📊 Using Firebase Firestore as database`);
});
