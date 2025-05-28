// src/index.js
// Entry point สำหรับ React Application - ระบบสุ่มข้อสอบ

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// สร้าง root element และ render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// การวัดประสิทธิภาพ (เลือกใช้ได้)
// หากต้องการส่งผลการวัดไปยัง analytics endpoint ให้ส่ง function
// เช่น reportWebVitals(console.log) หรือส่งไปยัง analytics service
reportWebVitals();