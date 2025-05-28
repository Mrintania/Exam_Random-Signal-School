// src/App.js
// Main Application Component สำหรับระบบสุ่มข้อสอบ

import React from 'react';
import ExamRandomizer from './components/ExamRandomizer';
import './App.css';

function App() {
  return (
    <div className="App">
      <ExamRandomizer />
    </div>
  );
}

export default App;