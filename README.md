# مركز بداية للتدخل المبكر والتأهيل

[![Website](https://img.shields.io/badge/website-live-blue)](https://bedaya-center.vercel.app)
[![Dashboard](https://img.shields.io/badge/dashboard-secure-green)](https://bedaya-center.vercel.app/dashboard.html)
[![License](https://img.shields.io/badge/license-MIT-red)](LICENSE)

موقع احترافي متكامل لمركز "بداية للتدخل المبكر والتأهيل" - نظام إدارة متكامل للحجوزات، النتائج، والتواصل مع العملاء.

## ✨ المميزات

### 🎨 تصميم احترافي
- **Glassmorphism** تصميم عصري بتأثير الزجاج
- **Dark Mode** كامل مع حفظ التفضيل
- **Animations** حركات سلسة واحترافية
- **Responsive** متجاوب مع جميع الأجهزة
- **RTL** دعم كامل للغة العربية

### 📱 الموقع الرئيسي
- الصفحة الرئيسية مع إحصائيات متحركة
- قسم من نحن مع بطاقات مميزة
- خدماتنا - 6 خدمات رئيسية
- المكان وخريطة جوجل
- حجز المواعيد
- الاستعلام عن النتائج
- نموذج تواصل
- Footer متكامل

### 👑 لوحة التحكم
- إحصائيات مباشرة (مبيعات - مستخدمين - حجوزات - نتائج)
- رسوم بيانية تفاعلية (Chart.js)
- إدارة الحجوزات (تعديل الحالة)
- إدارة الرسائل الواردة
- وضع مظلم للوحة التحكم
- تصميم SaaS Admin حديث

### 🔐 الأمان
- JWT Authentication
- Hashing كلمات المرور (bcryptjs)
- حماية الـ API rate limiting
- Firebase Security Rules

## 🛠 التقنيات المستخدمة

### Backend
- **Node.js** + **Express** - الخادم الخلفي
- **Firebase Admin SDK** - قاعدة البيانات والتخزين
- **JWT** - التوثيق
- **Nodemailer** - إرسال الإيميلات
- **bcryptjs** - تشفير كلمات المرور

### Frontend
- **HTML5/CSS3** - هيكل وتصميم الموقع
- **JavaScript (ES6+)** - التفاعلات
- **Chart.js** - الرسوم البيانية
- **AOS** - أنيميشن التمرير
- **Font Awesome 6** - الأيقونات
- **Axios** - طلبات API

### Infrastructure
- **Firebase Firestore** - قاعدة البيانات
- **Firebase Storage** - تخزين الملفات
- **Vercel** - الاستضافة والنشر

## 📦 تنصيب المشروع محلياً

### المتطلبات الأساسية
- Node.js (v18 أو أحدث)
- npm أو yarn
- حساب Firebase (للاستخدام الكامل)

### الخطوات

1. **نسخ المشروع**
```bash
git clone https://github.com/yourusername/bedaya-center.git
cd bedaya-center
