Contact List System (RBAC)
نظرة عامة

نظام لإدارة جهات الاتصال يعتمد على Role-Based Access Control (RBAC) بحيث يرى كل مستخدم البيانات المخصصة له فقط وفقًا للفنادق والأقسام المرتبط بها، مع تسجيل كامل لكل العمليات داخل النظام.

المتطلبات الأساسية في التاسك

كل مستخدم يمكنه رؤية بياناته فقط حسب Hotels & Departments المخصصة له

تسجيل Log لكل عملية يحتوي على:

IP Address

Timestamp

بيانات المستخدم

MAC Address

الـ Admin يمكنه:

تعديل صلاحيات أي مستخدم

عرض سجل العمليات (Audit Log)

إنشاء / تعديل / عرض / تعطيل / حذف المستخدمين

إدارة الكروت (Cards)

إدارة Module الصلاحيات بالكامل

الصلاحيات والأدوار
Admin

إدارة المستخدمين (Create, Edit, Disable, Delete, View)

إدارة الصلاحيات والأدوار

إدارة الكروت

عرض الـ Audit Logs

التحكم في نطاق وصول المستخدمين

Users

عرض البيانات المخصصة لهم فقط حسب الفندق والقسم

تنفيذ العمليات المسموح بها حسب الصلاحيات المعطاة

آلية العمل
Data Scoping

يتم فلترة البيانات تلقائيًا بناءً على:

Hotels المرتبط بها المستخدم

Departments المرتبط بها المستخدم

ولا يمكن للمستخدم الوصول لبيانات خارج نطاقه.

Audit Logging

يتم تسجيل كل عملية تشمل:

نوع العملية (Create / Update / Delete / View)

المستخدم المنفذ

IP Address

MAC Address

Timestamp

التقنيات المستخدمة
Backend

Node.js

Express.js

MySQL

JWT Authentication

RBAC Middleware

Frontend

React

TypeScript

Tailwind CSS

تشغيل المشروع
# Backend
cd back
npm install
npm start

# Frontend
cd front
npm install
npm run dev
قاعدة البيانات (الجداول الرئيسية)

users

roles

permissions

user_roles

role_permissions

hotels

departments

contacts

cards

audit_logs

الهدف من المشروع

تنفيذ نظام Contact Management آمن يحقق:

عزل البيانات حسب النطاق (Scoped Access)

إدارة مرنة للصلاحيات

تتبع كامل لكل العمليات

تحكم إداري كامل عبر لوحة الإدارة
