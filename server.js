const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { Stream } = require('stream');

dotenv.config();

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  storageBucket: `${firebaseConfig.project_id}.appspot.com`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(express.static('public'));

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.SESSION_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// API Routes

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.SESSION_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      message: 'تم تسجيل الدخول بنجاح'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    });
  }
});

// Contact
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  
  try {
    const contactData = {
      name,
      email,
      phone,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    
    const docRef = await db.collection('contacts').add(contactData);
    res.json({ success: true, id: docRef.id, message: 'تم إرسال رسالتك بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Booking
app.post('/api/booking', async (req, res) => {
  const { name, phone, date, time } = req.body;
  
  try {
    const bookingData = {
      name,
      phone,
      date,
      time,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };
    
    const docRef = await db.collection('bookings').add(bookingData);
    res.json({ success: true, id: docRef.id, message: 'تم حجز الموعد بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales - Create
app.post('/api/sales', authenticateToken, async (req, res) => {
  const { customerName, amount } = req.body;
  
  try {
    const saleData = {
      customerName,
      amount: parseFloat(amount),
      date: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('sales').add(saleData);
    res.json({ success: true, id: docRef.id, message: 'تم تسجيل البيع بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales - Get
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = db.collection('sales').orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    let sales = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      sales.push({
        id: doc.id,
        customerName: data.customerName,
        amount: data.amount,
        date: data.date?.toDate() || new Date()
      });
    });
    
    if (search) {
      sales = sales.filter(sale => 
        sale.customerName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedSales = sales.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      sales: paginatedSales,
      total: sales.length,
      page: parseInt(page),
      totalPages: Math.ceil(sales.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales - Delete
app.delete('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection('sales').doc(req.params.id).delete();
    res.json({ success: true, message: 'تم حذف البيع بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contacts - Get
app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = db.collection('contacts').orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    let contacts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      contacts.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        createdAt: data.createdAt?.toDate() || new Date(),
        read: data.read
      });
    });
    
    if (search) {
      contacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone.includes(search)
      );
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedContacts = contacts.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      contacts: paginatedContacts,
      total: contacts.length,
      page: parseInt(page),
      totalPages: Math.ceil(contacts.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contacts - Delete
app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection('contacts').doc(req.params.id).delete();
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings - Get
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = db.collection('bookings').orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    let bookings = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        date: data.date,
        time: data.time,
        createdAt: data.createdAt?.toDate() || new Date(),
        status: data.status
      });
    });
    
    if (search) {
      bookings = bookings.filter(booking => 
        booking.name.toLowerCase().includes(search.toLowerCase()) ||
        booking.phone.includes(search)
      );
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedBookings = bookings.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      bookings: paginatedBookings,
      total: bookings.length,
      page: parseInt(page),
      totalPages: Math.ceil(bookings.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings - Delete
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection('bookings').doc(req.params.id).delete();
    res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Result
app.post('/api/upload-result', authenticateToken, upload.single('file'), async (req, res) => {
  const { phoneNumber } = req.body;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'الرجاء اختيار ملف' });
  }
  
  try {
    const fileName = `results/${Date.now()}_${phoneNumber}_${file.originalname}`;
    const blob = bucket.file(fileName);
    
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });
    
    blobStream.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });
    
    blobStream.on('finish', async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      const resultData = {
        phoneNumber,
        fileUrl: publicUrl,
        fileName: file.originalname,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        fileSize: file.size
      };
      
      const docRef = await db.collection('results').add(resultData);
      res.json({ success: true, id: docRef.id, url: publicUrl, message: 'تم رفع النتيجة بنجاح' });
    });
    
    blobStream.end(file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Results - Get
app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = db.collection('results').orderBy('uploadedAt', 'desc');
    
    const snapshot = await query.get();
    let results = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        id: doc.id,
        phoneNumber: data.phoneNumber,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        fileSize: data.fileSize
      });
    });
    
    if (search) {
      results = results.filter(result => 
        result.phoneNumber.includes(search) ||
        result.fileName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      results: paginatedResults,
      total: results.length,
      page: parseInt(page),
      totalPages: Math.ceil(results.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Results - Delete
app.delete('/api/results/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await db.collection('results').doc(req.params.id).get();
    if (doc.exists) {
      const data = doc.data();
      const filePath = data.fileUrl.split('/').slice(-2).join('/');
      await bucket.file(filePath).delete();
      await db.collection('results').doc(req.params.id).delete();
    }
    res.json({ success: true, message: 'تم حذف النتيجة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send Email
app.post('/api/send-email', authenticateToken, async (req, res) => {
  const { userEmail, message } = req.body;
  
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: 'رسالة من منصة بداية',
      html: `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2563eb;">مرحباً بك في منصة بداية</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">شكراً لثقتكم بنا<br>فريق بداية</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    const emailData = {
      userEmail,
      message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    };
    
    const docRef = await db.collection('emails').add(emailData);
    res.json({ success: true, id: docRef.id, message: 'تم إرسال البريد الإلكتروني بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emails - Get
app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = db.collection('emails').orderBy('sentAt', 'desc');
    
    const snapshot = await query.get();
    let emails = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        userEmail: data.userEmail,
        message: data.message,
        sentAt: data.sentAt?.toDate() || new Date(),
        status: data.status
      });
    });
    
    if (search) {
      emails = emails.filter(email => 
        email.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        email.message.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedEmails = emails.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      emails: paginatedEmails,
      total: emails.length,
      page: parseInt(page),
      totalPages: Math.ceil(emails.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emails - Delete
app.delete('/api/emails/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection('emails').doc(req.params.id).delete();
    res.json({ success: true, message: 'تم حذف البريد بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const salesSnapshot = await db.collection('sales')
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();
    
    let todaySales = 0;
    salesSnapshot.forEach(doc => {
      todaySales += doc.data().amount || 0;
    });
    
    // Get total users (contacts)
    const contactsSnapshot = await db.collection('contacts').get();
    const totalUsers = contactsSnapshot.size;
    
    // Get total bookings
    const bookingsSnapshot = await db.collection('bookings').get();
    const totalBookings = bookingsSnapshot.size;
    
    // Get total results
    const resultsSnapshot = await db.collection('results').get();
    const totalResults = resultsSnapshot.size;
    
    res.json({
      todaySales,
      totalUsers,
      totalBookings,
      totalResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
