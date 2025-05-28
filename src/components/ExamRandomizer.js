// components/ExamRandomizer.js
// Main component สำหรับระบบสุ่มข้อสอบ - โรงเรียนทหารสื่อสาร กรมการทหารสื่อสาร

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, RefreshCw, FileText, BookOpen, AlertCircle, Loader2, BarChart3, GraduationCap, Shield, Zap, CheckCircle2, Users, Settings, Star, Award, Target } from 'lucide-react';
import {
    loadExamStructure,
    loadQuestions,
    randomizeQuestions as randomizeQuestionsUtil,
    exportToWord,
    exportToAiken,
    exportWithAnswers,
    filterValidQuestions,
    generateQuestionStats
} from '../utils/fileReader';

const ExamRandomizer = () => {
    // State Management
    const [folderStructure, setFolderStructure] = useState({});
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [questions, setQuestions] = useState([]);
    const [randomizedQuestions, setRandomizedQuestions] = useState([]);
    const [numQuestions, setNumQuestions] = useState(10);
    const [showAnswers, setShowAnswers] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Loading and Error States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [structureLoading, setStructureLoading] = useState(true);
    const [questionStats, setQuestionStats] = useState(null);

    // การโหลดโครงสร้างโฟลเดอร์เมื่อเริ่มต้น
    useEffect(() => {
        initializeExamStructure();
    }, []);

    // การคำนวณสถิติเมื่อมีการเปลี่ยนแปลงข้อสอบ
    useEffect(() => {
        if (questions.length > 0) {
            const stats = generateQuestionStats(questions);
            setQuestionStats(stats);
        } else {
            setQuestionStats(null);
        }
    }, [questions]);

    /**
     * ฟังก์ชันเริ่มต้นการโหลดโครงสร้างข้อสอบ
     */
    const initializeExamStructure = async () => {
        try {
            setStructureLoading(true);
            setError('');

            const structure = await loadExamStructure();
            setFolderStructure(structure);

            resetSelections();

        } catch (err) {
            setError(err.message);
            console.error('Failed to initialize exam structure:', err);
        } finally {
            setStructureLoading(false);
        }
    };

    /**
     * ฟังก์ชันรีเซ็ตการเลือกทั้งหมด
     */
    const resetSelections = () => {
        setSelectedLevel('');
        setSelectedSubject('');
        setQuestions([]);
        setRandomizedQuestions([]);
        setQuestionStats(null);
    };

    /**
     * ฟังก์ชันจัดการการเปลี่ยนระดับ
     */
    const handleLevelChange = useCallback((level) => {
        setSelectedLevel(level);
        setSelectedSubject('');
        setQuestions([]);
        setRandomizedQuestions([]);
        setError('');
        setQuestionStats(null);
    }, []);

    /**
     * ฟังก์ชันจัดการการเปลี่ยนวิชา
     */
    const handleSubjectChange = useCallback(async (subject) => {
        if (!subject || !selectedLevel) {
            setSelectedSubject('');
            setQuestions([]);
            setRandomizedQuestions([]);
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSelectedSubject(subject);

            const questionsData = await loadQuestions(selectedLevel, subject);
            const validQuestions = filterValidQuestions(questionsData);

            if (validQuestions.length === 0) {
                throw new Error('ไม่พบข้อสอบที่ถูกต้องในไฟล์นี้');
            }

            setQuestions(validQuestions);
            setRandomizedQuestions([]);

            // ปรับจำนวนข้อสอบให้ไม่เกินจำนวนข้อสอบที่มี
            if (numQuestions > validQuestions.length) {
                setNumQuestions(validQuestions.length);
            }

        } catch (err) {
            setError(err.message);
            setQuestions([]);
            console.error('Failed to load questions:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedLevel, numQuestions]);

    /**
     * ฟังก์ชันสุ่มข้อสอบ
     */
    const handleRandomizeQuestions = useCallback(() => {
        try {
            setError('');
            const randomized = randomizeQuestionsUtil(questions, numQuestions);
            setRandomizedQuestions(randomized);
        } catch (err) {
            setError(err.message);
            console.error('Failed to randomize questions:', err);
        }
    }, [questions, numQuestions]);

    /**
     * ฟังก์ชันจัดการการ Export ไฟล์
     */
    const handleExport = useCallback((exportType) => {
        try {
            setError('');

            switch (exportType) {
                case 'word':
                    exportToWord(randomizedQuestions, selectedLevel, selectedSubject);
                    break;
                case 'aiken':
                    exportToAiken(randomizedQuestions, selectedLevel, selectedSubject);
                    break;
                case 'answers':
                    exportWithAnswers(randomizedQuestions, selectedLevel, selectedSubject);
                    break;
                default:
                    throw new Error('รูปแบบการ Export ไม่ถูกต้อง');
            }
        } catch (err) {
            setError(err.message);
            console.error('Failed to export:', err);
        }
    }, [randomizedQuestions, selectedLevel, selectedSubject]);

    /**
     * Component สำหรับแสดงสถิติข้อสอบ
     */
    const QuestionStatsDisplay = () => {
        if (!questionStats) return null;

        return (
            <div className="bg-white border border-blue-200 rounded-lg shadow-md p-5">
                <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                    <div className="bg-blue-600 text-white p-2 rounded-md mr-3">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">สถิติข้อสอบ</h4>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">จำนวนข้อสอบทั้งหมด</span>
                            <span className="text-2xl font-bold text-blue-600">{questionStats.total} ข้อ</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-gray-600 border-b pb-1">การกระจายของคำตอบ</h5>
                        {Object.entries(questionStats.answerDistribution).map(([answer, count]) => (
                            <div key={answer} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-700">ตัวเลือก {answer}</span>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-gray-800">{count} ข้อ</span>
                                    <span className="text-xs text-gray-500 ml-2">({Math.round((count / questionStats.total) * 100)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Component สำหรับแสดง Error Message
     */
    const ErrorDisplay = () => {
        if (!error) return null;

        return (
            <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                    <div className="bg-red-100 text-red-600 p-2 rounded-md mr-3">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-red-800 font-semibold">เกิดข้อผิดพลาด</h4>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Component สำหรับแสดงข้อมูลข้อสอบที่เลือก
     */
    const ExamInfo = () => {
        if (randomizedQuestions.length === 0) return null;

        return (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex items-center">
                    <div className="bg-green-100 text-green-600 p-2 rounded-md mr-3">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-green-800 font-semibold text-lg">
                            {selectedLevel} - {selectedSubject.replace('.txt', '')}
                        </h4>
                        <p className="text-green-700 text-sm">
                            จำนวนข้อสอบที่สุ่มได้: <span className="font-semibold">{randomizedQuestions.length}</span> ข้อ
                            จากทั้งหมด <span className="font-semibold">{questions.length}</span> ข้อ
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Component สำหรับแสดงข้อสอบ
     */
    const QuestionDisplay = ({ question, index }) => (
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start mb-4">
                <div className="bg-blue-600 text-white rounded-md px-3 py-1 text-sm font-semibold mr-4 mt-1 min-w-fit">
                    ข้อ {index + 1}
                </div>
                <h4 className="text-lg font-medium text-gray-800 leading-relaxed flex-1">
                    {question.question}
                </h4>
            </div>

            <div className="space-y-3 ml-4">
                {question.options.map((option, optIndex) => {
                    const optionLabel = ['ก', 'ข', 'ค', 'ง'][optIndex];
                    const isCorrect = optionLabel === question.answer;

                    return (
                        <div
                            key={optIndex}
                            className={`p-3 rounded-md border transition-colors duration-200 ${showAnswers && isCorrect
                                ? 'bg-green-50 border-green-300 text-green-800'
                                : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold mr-3 ${showAnswers && isCorrect
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 text-white'
                                    }`}>
                                    {optionLabel}
                                </div>
                                <span className="text-gray-700 leading-relaxed flex-1">{option}</span>
                                {showAnswers && isCorrect && (
                                    <div className="text-green-600 font-semibold text-sm flex items-center">
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        เฉลย
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showAnswers && (
                <div className="mt-4 p-3 bg-green-50 rounded-md border-l-4 border-green-400">
                    <span className="text-sm font-semibold text-green-800">
                        คำตอบที่ถูกต้อง: {question.answer}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header Section - Government Style */}
            <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">
                            {/* Government Badge */}
                            <div className="bg-white text-blue-800 p-4 rounded-full mr-6 shadow-lg">
                                <Shield className="h-8 w-8" />
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <GraduationCap className="h-6 w-6 mr-2" />
                                    <h1 className="text-3xl font-bold">ระบบสุ่มข้อสอบ</h1>
                                </div>
                                <h2 className="text-xl font-semibold text-blue-100">โรงเรียนทหารสื่อสาร</h2>
                                <p className="text-blue-200 text-lg mt-1">กรมการทหารสื่อสาร</p>

                                {/* Decorative Elements */}
                                <div className="flex items-center justify-center mt-3 space-x-2">
                                    <Star className="h-4 w-4 text-yellow-300" />
                                    <div className="h-1 w-16 bg-yellow-300 rounded-full"></div>
                                    <Star className="h-4 w-4 text-yellow-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Error Display */}
                <ErrorDisplay />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Control Panel - Government Style */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Main Controls */}
                        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                                <div className="bg-blue-600 text-white p-2 rounded-md mr-3">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">การตั้งค่าระบบ</h3>
                            </div>

                            <div className="space-y-5">
                                {/* Level Selection */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                        เลือกระดับการศึกษา
                                    </label>
                                    {structureLoading ? (
                                        <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                                            <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedLevel}
                                            onChange={(e) => handleLevelChange(e.target.value)}
                                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white text-gray-700"
                                        >
                                            <option value="">-- เลือกระดับ --</option>
                                            {Object.keys(folderStructure).map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Subject Selection */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                        เลือกวิชา
                                    </label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        disabled={!selectedLevel || loading}
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- เลือกวิชา --</option>
                                        {selectedLevel && folderStructure[selectedLevel]?.map(subject => (
                                            <option key={subject} value={subject}>
                                                {subject.replace('.txt', '')}
                                            </option>
                                        ))}
                                    </select>
                                    {loading && (
                                        <div className="flex items-center mt-2 text-sm text-blue-600">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            กำลังโหลดข้อสอบ...
                                        </div>
                                    )}
                                </div>

                                {/* Number of Questions */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                        จำนวนข้อสอบที่ต้องการ
                                    </label>
                                    <input
                                        type="number"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                                        min="1"
                                        max={questions.length || 100}
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white text-gray-700"
                                    />
                                    <div className="flex items-center mt-2 text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-1" />
                                        ข้อสอบทั้งหมด: <span className="font-semibold ml-1 text-blue-600">{questions.length}</span> ข้อ
                                    </div>
                                </div>

                                {/* Randomize Button */}
                                <button
                                    onClick={handleRandomizeQuestions}
                                    disabled={questions.length === 0 || loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center shadow-md disabled:cursor-not-allowed"
                                >
                                    <Target className="mr-2 h-5 w-5" />
                                    สุ่มข้อสอบ
                                </button>
                            </div>
                        </div>

                        {/* Statistics Panel */}
                        {questionStats && showStats && <QuestionStatsDisplay />}

                        {/* System Management */}
                        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                                <div className="bg-green-600 text-white p-2 rounded-md mr-3">
                                    <RefreshCw className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">จัดการระบบ</h3>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={initializeExamStructure}
                                    disabled={structureLoading}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                                >
                                    {structureLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    รีเฟรชข้อมูล
                                </button>

                                {questionStats && (
                                    <button
                                        onClick={() => setShowStats(!showStats)}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                                    >
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        {showStats ? 'ซ่อน' : 'แสดง'}สถิติ
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-3 text-center border-t pt-3">
                                กดรีเฟรชเพื่อโหลดข้อมูลใหม่หากมีการเพิ่มหรือแก้ไขไฟล์
                            </p>
                        </div>

                        {/* Export Section */}
                        {randomizedQuestions.length > 0 && (
                            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                                    <div className="bg-orange-600 text-white p-2 rounded-md mr-3">
                                        <Download className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800">ส่งออกข้อสอบ</h3>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleExport('word')}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export เอกสาร Word
                                    </button>

                                    <button
                                        onClick={() => handleExport('aiken')}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export สำหรับ Moodle
                                    </button>

                                    <button
                                        onClick={() => handleExport('answers')}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export พร้อมเฉลย
                                    </button>
                                </div>

                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showAnswers}
                                            onChange={(e) => setShowAnswers(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                        />
                                        <span className="text-sm font-medium text-gray-700">แสดงเฉลยในหน้าจอ</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Display Panel */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8">
                            <div className="text-center mb-8 pb-6 border-b border-gray-200">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="bg-blue-600 text-white p-3 rounded-lg mr-4">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">ข้อสอบที่สุ่มได้</h3>
                                </div>
                                <p className="text-gray-600">ระบบจัดการข้อสอบอัตโนมัติ สำหรับการประเมินผลการเรียน</p>
                            </div>

                            {structureLoading ? (
                                <div className="text-center py-16">
                                    <div className="bg-blue-50 p-8 rounded-lg inline-block mb-6">
                                        <Loader2 className="h-16 w-16 text-blue-600 mb-4 animate-spin mx-auto" />
                                        <p className="text-lg font-medium text-gray-700">กำลังโหลดข้อมูลระบบ...</p>
                                        <p className="text-sm text-gray-500 mt-2">กรุณารอสักครู่</p>
                                    </div>
                                </div>
                            ) : randomizedQuestions.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="bg-gray-50 p-8 rounded-lg inline-block mb-6">
                                        <BookOpen className="h-16 w-16 text-gray-400 mb-4 mx-auto" />
                                        <h4 className="text-xl font-semibold text-gray-700 mb-2">เริ่มต้นการใช้งาน</h4>
                                        <p className="text-gray-500 mb-4">กรุณาเลือกระดับและวิชาที่ต้องการ</p>
                                        <div className="text-sm text-gray-400">
                                            <p>1. เลือกระดับการศึกษา</p>
                                            <p>2. เลือกวิชาที่ต้องการ</p>
                                            <p>3. กดปุ่ม "สุ่มข้อสอบ"</p>
                                        </div>
                                    </div>
                                    {Object.keys(folderStructure).length === 0 && (
                                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center justify-center">
                                                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                                <p className="text-sm text-red-700 font-medium">
                                                    ไม่พบข้อมูลข้อสอบ กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <ExamInfo />

                                    <div className="space-y-6">
                                        {randomizedQuestions.map((question, index) => (
                                            <QuestionDisplay
                                                key={`${index}-${question.question.substring(0, 20)}`}
                                                question={question}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-6 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Shield className="h-5 w-5 mr-2" />
                        <span className="font-semibold">โรงเรียนทหารสื่อสาร กรมการทหารสื่อสาร</span>
                    </div>
                    <p className="text-gray-300 text-sm">ระบบสุ่มข้อสอบอัตโนมัติ เพื่อการศึกษาที่มีประสิทธิภาพ</p>
                </div>
            </footer>
        </div>
    );
};

export default ExamRandomizer;