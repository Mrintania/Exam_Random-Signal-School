// server/server.js
// Backend server สำหรับระบบสุ่มข้อสอบ - โรงเรียนทหารสื่อสาร

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API สำหรับตรวจสอบสถานะ server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Exam Randomizer Server is running',
    timestamp: new Date().toISOString()
  });
});

// API สำหรับอ่านโครงสร้างโฟลเดอร์
app.get('/api/exam-structure', async (req, res) => {
  try {
    const examPath = path.join(__dirname, '../Exam');

    // ตรวจสอบว่าโฟลเดอร์ Exam มีอยู่หรือไม่
    try {
      await fs.access(examPath);
    } catch (error) {
      console.error('Exam folder not found:', examPath);
      return res.status(404).json({
        error: 'ไม่พบโฟลเดอร์ Exam กรุณาสร้างโฟลเดอร์และใส่ไฟล์ข้อสอบ'
      });
    }

    const structure = {};
    const levels = await fs.readdir(examPath);

    for (const level of levels) {
      const levelPath = path.join(examPath, level);

      try {
        const stat = await fs.stat(levelPath);

        if (stat.isDirectory()) {
          const subjects = await fs.readdir(levelPath);
          const txtFiles = subjects.filter(file =>
            file.toLowerCase().endsWith('.txt') &&
            !file.startsWith('.')
          );

          if (txtFiles.length > 0) {
            structure[level] = txtFiles;
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read level directory ${level}:`, error.message);
        continue;
      }
    }

    console.log('Exam structure loaded:', structure);
    res.json(structure);

  } catch (error) {
    console.error('Error reading exam structure:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการอ่านโครงสร้างโฟลเดอร์',
      details: error.message
    });
  }
});

// API สำหรับอ่านข้อสอบจากไฟล์
app.get('/api/questions/:level/:subject', async (req, res) => {
  try {
    const { level, subject } = req.params;

    // Validate parameters
    if (!level || !subject) {
      return res.status(400).json({
        error: 'กรุณาระบุระดับและวิชาที่ต้องการ'
      });
    }

    const filePath = path.join(__dirname, '../Exam', level, subject);

    // ตรวจสอบว่าไฟล์มีอยู่และเป็นไฟล์ .txt
    if (!subject.toLowerCase().endsWith('.txt')) {
      return res.status(400).json({
        error: 'รองรับเฉพาะไฟล์ .txt เท่านั้น'
      });
    }

    try {
      await fs.access(filePath);
    } catch (error) {
      console.error('File not found:', filePath);
      return res.status(404).json({
        error: 'ไม่พบไฟล์ข้อสอบที่ต้องการ'
      });
    }

    const content = await fs.readFile(filePath, 'utf8');

    if (!content.trim()) {
      return res.status(400).json({
        error: 'ไฟล์ข้อสอบว่างเปล่า'
      });
    }

    const questions = parseQuestions(content);

    if (questions.length === 0) {
      return res.status(400).json({
        error: 'ไม่พบข้อสอบในรูปแบบที่ถูกต้องในไฟล์นี้'
      });
    }

    console.log(`Loaded ${questions.length} questions from ${level}/${subject}`);
    res.json(questions);

  } catch (error) {
    console.error('Error reading questions:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการอ่านข้อสอบ',
      details: error.message
    });
  }
});

/**
 * ฟังก์ชันแปลงข้อสอบจากไฟล์ txt เป็น JSON
 * รองรับรูปแบบ:
 * คำถาม
 * A) ตัวเลือก 1
 * B) ตัวเลือก 2  
 * C) ตัวเลือก 3
 * D) ตัวเลือก 4
 * ANSWER: C
 */
function parseQuestions(content) {
  const questions = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);

  let currentQuestion = null;
  let currentOptions = [];
  let currentAnswer = '';
  let questionStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ข้าม comment lines หรือ empty lines
    if (line.startsWith('#') || line.startsWith('//') || line.length === 0) {
      continue;
    }

    // ตรวจสอบตัวเลือก A), B), C), D)
    const optionMatch = line.match(/^([A-D])\)\s*(.+)/);
    if (optionMatch) {
      questionStarted = true;
      currentOptions.push(optionMatch[2].trim());
      continue;
    }

    // ตรวจสอบคำตอบ ANSWER:
    const answerMatch = line.match(/^ANSWER:\s*([A-D])/i);
    if (answerMatch && questionStarted) {
      const answerLetter = answerMatch[1].toUpperCase();
      const mapping = { 'A': 'ก', 'B': 'ข', 'C': 'ค', 'D': 'ง' };
      currentAnswer = mapping[answerLetter] || answerLetter;

      // บันทึกคำถามที่สมบูรณ์
      if (currentQuestion && currentOptions.length === 4 && currentAnswer) {
        questions.push({
          question: currentQuestion.trim(),
          options: [...currentOptions],
          answer: currentAnswer
        });
      }

      // รีเซ็ตตัวแปร
      currentQuestion = null;
      currentOptions = [];
      currentAnswer = '';
      questionStarted = false;
      continue;
    }

    // หากไม่ใช่ตัวเลือกหรือคำตอบ แสดงว่าเป็นคำถามใหม่
    if (!questionStarted) {
      // บันทึกคำถามก่อนหน้า (ถ้ามี)
      if (currentQuestion && currentOptions.length === 4 && currentAnswer) {
        questions.push({
          question: currentQuestion.trim(),
          options: [...currentOptions],
          answer: currentAnswer
        });
      }

      // เริ่มคำถามใหม่
      currentQuestion = line;
      currentOptions = [];
      currentAnswer = '';
      questionStarted = false;
    }
  }

  // บันทึกคำถามสุดท้าย
  if (currentQuestion && currentOptions.length === 4 && currentAnswer) {
    questions.push({
      question: currentQuestion.trim(),
      options: [...currentOptions],
      answer: currentAnswer
    });
  }

  // ตรวจสอบความถูกต้องของข้อสอบ
  const validQuestions = questions.filter(q =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.answer &&
    q.options.every(opt => opt && opt.length > 0)
  );

  console.log(`Parsed ${validQuestions.length} valid questions from ${questions.length} total`);
  return validQuestions;
}

// API สำหรับสร้างไฟล์ตัวอย่าง
app.post('/api/create-sample', async (req, res) => {
  try {
    const examPath = path.join(__dirname, '../Exam');
    const sampleLevel = '01 ส.อ. เป็น จ.ส.อ.';
    const sampleDir = path.join(examPath, sampleLevel);

    // สร้างโฟลเดอร์หากไม่มี
    await fs.mkdir(sampleDir, { recursive: true });

    const sampleContent = `" ที่ของผู้ให้ข่าว " คืออะไร
A) สถานที่ ที่เขียนข่าว
B) ที่อยู่หรือหน่วยของผู้ให้ข่าว
C) ลำดับที่ของเอกสารส่งออก
D) ตำแหน่งหน้าที่ของผู้ให้ข่าว
ANSWER: C

"ระบบการสื่อสารที่ต้องการ ประกอบด้วย ความเชื่อถือได้ ความรวดเร็ว ความปลอดภัย และความคงอยู่" ข้อใดกล่าวถูกต้องเกี่ยวกับ "ความคงอยู่"
A) ส่งข่าวถึงผู้รับถูกต้องตรงกัน
B) ปฏิบัติด้วยความรวดเร็ว ตามลำดับความเร่งด่วน
C) พิทักษ์ รักษา ปฏิบัติต่อข่าวตามชั้นความลับ รอดพ้นจากการดักรับของข้าศึก
D) สามารถใช้ระบบการสื่อสารทดแทนกันได้ เมื่อระบบใดระบบหนึ่งขาดการติดต่อสื่อสาร
ANSWER: D

การสื่อสารโดยใช้วิทยุ มีข้อดีคืออะไร
A) ส่งข้อมูลได้เร็วที่สุด
B) ความปลอดภัยสูงที่สุด
C) สามารถสื่อสารได้ในระยะไกล
D) ใช้ไฟฟ้าน้อยที่สุด
ANSWER: C`;

    const sampleFile = path.join(sampleDir, 'วิชาทหารสื่อสาร.txt');
    await fs.writeFile(sampleFile, sampleContent, 'utf8');

    res.json({
      message: 'สร้างไฟล์ตัวอย่างเรียบร้อยแล้ว',
      path: sampleFile
    });

  } catch (error) {
    console.error('Error creating sample file:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการสร้างไฟล์ตัวอย่าง',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    details: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'ไม่พบ API endpoint ที่ต้องการ'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🎯 Exam Randomizer Server');
  console.log('🏫 โรงเรียนนายร้อยกิจการฯ');
  console.log('📡 กรมสื่อสาร กองทัพบก');
  console.log('=================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Exam folder: ${path.join(__dirname, '../Exam')}`);
  console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server interrupted, shutting down gracefully...');
  process.exit(0);
});