const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Firebase Admin Initialization
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API Routes

// Bookings
app.post('/api/bookings', async (req, res) => {
  try {
    const { fullName, phone, date, time } = req.body;
    
    const bookingRef = db.collection('bookings').doc();
    await bookingRef.set({
      fullName,
      phone,
      date,
      time,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send email notification
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'حجز جديد - مركز بداية',
      html: `
        <h2>حجز جديد</h2>
        <p><strong>الاسم:</strong> ${fullName}</p>
        <p><strong>رقم الهاتف:</strong> ${phone}</p>
        <p><strong>التاريخ:</strong> ${date}</p>
        <p><strong>الوقت:</strong> ${time}</p>
      `
    });

    res.status(201).json({ success: true, id: bookingRef.id });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking by phone
app.get('/api/bookings/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const bookingsSnapshot = await db.collection('bookings')
      .where('phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (bookingsSnapshot.empty) {
      return res.status(404).json({ error: 'No bookings found' });
    }

    const booking = bookingsSnapshot.docs[0].data();
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contacts
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    const contactRef = db.collection('contacts').doc();
    await contactRef.set({
      name,
      email,
      phone,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send email notification
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'رسالة جديدة - مركز بداية',
      html: `
        <h2>رسالة جديدة من ${name}</h2>
        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
        <p><strong>رقم الهاتف:</strong> ${phone}</p>
        <p><strong>الرسالة:</strong></p>
        <p>${message}</p>
      `
    });

    res.status(201).json({ success: true, id: contactRef.id });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Results by phone
app.get('/api/results/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const resultsSnapshot = await db.collection('results')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (resultsSnapshot.empty) {
      return res.status(404).json({ error: 'No results found' });
    }

    const result = resultsSnapshot.docs[0].data();
    
    // Get file URL from Firebase Storage
    if (result.filePath) {
      const file = bucket.file(result.filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000
      });
      result.fileUrl = url;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [bookingsSnapshot, contactsSnapshot, resultsSnapshot] = await Promise.all([
      db.collection('bookings').get(),
      db.collection('contacts').get(),
      db.collection('results').get()
    ]);

    const todayBookings = await db.collection('bookings')
      .where('createdAt', '>=', today)
      .get();

    res.json({
      totalBookings: bookingsSnapshot.size,
      totalContacts: contactsSnapshot.size,
      totalResults: resultsSnapshot.size,
      todayBookings: todayBookings.size,
      totalRevenue: bookingsSnapshot.size * 350 // Example: 350 EGP per session
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings for dashboard
app.get('/api/dashboard/bookings', authenticateToken, async (req, res) => {
  try {
    const bookingsSnapshot = await db.collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const bookings = [];
    bookingsSnapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all contacts for dashboard
app.get('/api/dashboard/contacts', authenticateToken, async (req, res) => {
  try {
    const contactsSnapshot = await db.collection('contacts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const contacts = [];
    contactsSnapshot.forEach(doc => {
      contacts.push({ id: doc.id, ...doc.data() });
    });

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
app.put('/api/dashboard/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection('bookings').doc(id).update({ status });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
