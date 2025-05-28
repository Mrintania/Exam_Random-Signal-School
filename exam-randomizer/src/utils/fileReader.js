// utils/fileReader.js
// Utility functions สำหรับการจัดการไฟล์ข้อสอบ

/**
 * Base URL สำหรับ API calls
 */
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * ฟังก์ชันสำหรับโหลดโครงสร้างโฟลเดอร์ข้อสอบ
 * @returns {Promise<Object>} โครงสร้างโฟลเดอร์ในรูปแบบ { level: [subjects] }
 */
export const loadExamStructure = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/exam-structure`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const structure = await response.json();
        return structure;
    } catch (error) {
        console.error('Error loading exam structure:', error);
        throw new Error('ไม่สามารถโหลดโครงสร้างโฟลเดอร์ได้ กรุณาตรวจสอบว่า backend server ทำงานอยู่');
    }
};

/**
 * ฟังก์ชันสำหรับโหลดข้อสอบจากไฟล์ที่เลือก
 * @param {string} level - ระดับการศึกษา
 * @param {string} subject - วิชา
 * @returns {Promise<Array>} array ของข้อสอบ
 */
export const loadQuestions = async (level, subject) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const questionsData = await response.json();

        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            throw new Error('ไม่พบข้อสอบในไฟล์นี้หรือรูปแบบไฟล์ไม่ถูกต้อง');
        }

        return questionsData;
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
};

/**
 * ฟังก์ชันสำหรับสุ่มข้อสอบ
 * @param {Array} questions - array ของข้อสอบทั้งหมด
 * @param {number} count - จำนวนข้อสอบที่ต้องการ
 * @returns {Array} array ของข้อสอบที่สุ่มแล้ว
 */
export const randomizeQuestions = (questions, count) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('ไม่มีข้อสอบให้สุ่ม');
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, questions.length));
};

/**
 * ฟังก์ชันสำหรับ export ข้อสอบในรูปแบบ MS Word
 * @param {Array} questions - array ของข้อสอบที่สุ่มแล้ว
 * @param {string} level - ระดับการศึกษา
 * @param {string} subject - วิชา
 */
export const exportToWord = (questions, level, subject) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('ไม่มีข้อสอบให้ Export');
    }

    let content = `ข้อสอบสุ่ม - ${level}\n`;
    content += `วิชา: ${subject.replace('.txt', '')}\n`;
    content += `จำนวนข้อสอบ: ${questions.length} ข้อ\n`;
    content += `วันที่สร้าง: ${new Date().toLocaleDateString('th-TH')}\n\n`;

    questions.forEach((q, index) => {
        content += `${index + 1}. ${q.question}\n`;
        content += `ก. ${q.options[0]}\n`;
        content += `ข. ${q.options[1]}\n`;
        content += `ค. ${q.options[2]}\n`;
        content += `ง. ${q.options[3]}\n\n`;
    });

    downloadFile(content, `exam_${level}_${subject.replace('.txt', '')}.txt`);
};

/**
 * ฟังก์ชันสำหรับ export ข้อสอบในรูปแบบ Aiken (สำหรับ Moodle)
 * @param {Array} questions - array ของข้อสอบที่สุ่มแล้ว
 * @param {string} level - ระดับการศึกษา
 * @param {string} subject - วิชา
 */
export const exportToAiken = (questions, level, subject) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('ไม่มีข้อสอบให้ Export');
    }

    let content = '';

    questions.forEach((q, index) => {
        content += `${q.question}\n`;
        content += `A. ${q.options[0]}\n`;
        content += `B. ${q.options[1]}\n`;
        content += `C. ${q.options[2]}\n`;
        content += `D. ${q.options[3]}\n`;

        // แปลง ก,ข,ค,ง เป็น A,B,C,D สำหรับรูปแบบ Aiken
        const answerMapping = { 'ก': 'A', 'ข': 'B', 'ค': 'C', 'ง': 'D' };
        const aikenAnswer = answerMapping[q.answer] || q.answer;
        content += `ANSWER: ${aikenAnswer}\n\n`;
    });

    downloadFile(content, `aiken_${level}_${subject.replace('.txt', '')}.txt`);
};

/**
 * ฟังก์ชันสำหรับ export ข้อสอบพร้อมเฉลย
 * @param {Array} questions - array ของข้อสอบที่สุ่มแล้ว
 * @param {string} level - ระดับการศึกษา
 * @param {string} subject - วิชา
 */
export const exportWithAnswers = (questions, level, subject) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('ไม่มีข้อสอบให้ Export');
    }

    let content = `เฉลยข้อสอบ - ${level}\n`;
    content += `วิชา: ${subject.replace('.txt', '')}\n`;
    content += `จำนวนข้อสอบ: ${questions.length} ข้อ\n`;
    content += `วันที่สร้าง: ${new Date().toLocaleDateString('th-TH')}\n\n`;

    questions.forEach((q, index) => {
        content += `${index + 1}. ${q.question}\n`;
        content += `ก. ${q.options[0]}\n`;
        content += `ข. ${q.options[1]}\n`;
        content += `ค. ${q.options[2]}\n`;
        content += `ง. ${q.options[3]}\n`;
        content += `เฉลย: ${q.answer}\n\n`;
    });

    downloadFile(content, `answers_${level}_${subject.replace('.txt', '')}.txt`);
};

/**
 * ฟังก์ชันสำหรับดาวน์โหลดไฟล์
 * @param {string} content - เนื้อหาของไฟล์
 * @param {string} filename - ชื่อไฟล์
 */
const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * ฟังก์ชันสำหรับตรวจสอบความถูกต้องของข้อสอบ
 * @param {Object} question - ข้อสอบที่ต้องการตรวจสอบ
 * @returns {boolean} true หากข้อสอบถูกต้อง
 */
export const validateQuestion = (question) => {
    if (!question || typeof question !== 'object') {
        return false;
    }

    const { question: q, options, answer } = question;

    // ตรวจสอบคำถาม
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return false;
    }

    // ตรวจสอบตัวเลือก
    if (!Array.isArray(options) || options.length !== 4) {
        return false;
    }

    for (const option of options) {
        if (!option || typeof option !== 'string' || option.trim().length === 0) {
            return false;
        }
    }

    // ตรวจสอบคำตอบ
    const validAnswers = ['ก', 'ข', 'ค', 'ง', 'A', 'B', 'C', 'D'];
    if (!answer || !validAnswers.includes(answer)) {
        return false;
    }

    return true;
};

/**
 * ฟังก์ชันสำหรับกรองข้อสอบที่ถูกต้อง
 * @param {Array} questions - array ของข้อสอบ
 * @returns {Array} array ของข้อสอบที่ถูกต้อง
 */
export const filterValidQuestions = (questions) => {
    if (!Array.isArray(questions)) {
        return [];
    }

    return questions.filter(validateQuestion);
};

/**
 * ฟังก์ชันสำหรับแปลงรูปแบบคำตอบ
 * @param {string} answer - คำตอบในรูปแบบเดิม
 * @param {string} format - รูปแบบที่ต้องการ ('thai' หรือ 'english')
 * @returns {string} คำตอบในรูปแบบที่ต้องการ
 */
export const convertAnswerFormat = (answer, format = 'thai') => {
    const thaiToEnglish = { 'ก': 'A', 'ข': 'B', 'ค': 'C', 'ง': 'D' };
    const englishToThai = { 'A': 'ก', 'B': 'ข', 'C': 'ค', 'D': 'ง' };

    if (format === 'english') {
        return thaiToEnglish[answer] || answer;
    } else {
        return englishToThai[answer] || answer;
    }
};

/**
 * ฟังก์ชันสำหรับสร้างสถิติข้อสอบ
 * @param {Array} questions - array ของข้อสอบ
 * @returns {Object} สถิติของข้อสอบ
 */
export const generateQuestionStats = (questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return {
            total: 0,
            answerDistribution: { 'ก': 0, 'ข': 0, 'ค': 0, 'ง': 0 },
            averageQuestionLength: 0,
            averageOptionLength: 0
        };
    }

    const answerDistribution = { 'ก': 0, 'ข': 0, 'ค': 0, 'ง': 0 };
    let totalQuestionLength = 0;
    let totalOptionLength = 0;

    questions.forEach(q => {
        if (answerDistribution.hasOwnProperty(q.answer)) {
            answerDistribution[q.answer]++;
        }

        totalQuestionLength += q.question.length;
        totalOptionLength += q.options.reduce((sum, option) => sum + option.length, 0);
    });

    return {
        total: questions.length,
        answerDistribution,
        averageQuestionLength: Math.round(totalQuestionLength / questions.length),
        averageOptionLength: Math.round(totalOptionLength / (questions.length * 4))
    };
};