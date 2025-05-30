// src/components/ExamRandomizer.js
// Modern Interface with Pure CSS (ไม่ใช้ Tailwind)

import React, { useState, useCallback, useEffect } from 'react';
import {
    Download, RefreshCw, FileText, BookOpen, AlertCircle,
    Loader2, BarChart3, GraduationCap, Shield, CheckCircle2,
    Users, Settings, Target, Eye, EyeOff,
    TrendingUp, Award, ChevronDown, Menu, X
} from 'lucide-react';

// Import real API functions
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

const ModernExamRandomizer = () => {
    // State Management
    const [folderStructure, setFolderStructure] = useState({});
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [questions, setQuestions] = useState([]);
    const [randomizedQuestions, setRandomizedQuestions] = useState([]);
    const [numQuestions, setNumQuestions] = useState(10);
    const [showAnswers, setShowAnswers] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    // Modern Card Component
    const ModernCard = ({ children, className = "", hover = true }) => (
        <div className={`bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg ${hover ? 'hover:shadow-2xl hover:border-gray-300' : ''} transition-all duration-300 ${className}`}>
            {children}
        </div>
    );

    // Stats Card Component
    const StatsCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
        <ModernCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl text-white ${color === 'blue' ? 'bg-gradient-blue-purple' :
                    color === 'green' ? 'bg-gradient-green' :
                        color === 'purple' ? 'from-purple-500 to-purple-600' : 'bg-gradient-orange'}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{value}</div>
                    <div className="text-sm text-gray-500">{subtitle}</div>
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        </ModernCard>
    );

    // Question Card Component
    const QuestionCard = ({ question, index }) => (
        <ModernCard className="p-8 mb-6">
            <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gradient-blue-purple text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {index + 1}
                </div>
                <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-800 leading-relaxed">
                        {question.question}
                    </h4>
                </div>
            </div>

            <div className="space-y-3">
                {question.options.map((option, optIndex) => {
                    const optionLabel = ['ก', 'ข', 'ค', 'ง'][optIndex];
                    const isCorrect = optionLabel === question.answer;

                    return (
                        <div
                            key={optIndex}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${showAnswers && isCorrect
                                ? 'from-green-50 to-emerald-50 border-green-300 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 flex-shrink-0 ${showAnswers && isCorrect
                                    ? 'bg-gradient-green text-white'
                                    : 'bg-gray-700 text-white hover:bg-blue-600'
                                    }`}>
                                    {optionLabel}
                                </div>
                                <span className="text-gray-700 leading-relaxed flex-1 transition-colors">
                                    {option}
                                </span>
                                {showAnswers && isCorrect && (
                                    <div className="flex items-center space-x-2 text-green-600 font-semibold">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="text-sm">เฉลย</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showAnswers && (
                <div className="mt-6 p-4 from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400">
                    <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">
                            คำตอบที่ถูกต้อง: {question.answer}
                        </span>
                    </div>
                </div>
            )}
        </ModernCard>
    );

    // Control Panel Component
    const ControlPanel = () => (
        <div className="space-y-6">
            {/* Level Selection */}
            <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                    เลือกระดับการศึกษา
                </label>
                <div className="relative">
                    <select
                        value={selectedLevel}
                        onChange={(e) => handleLevelChange(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white text-gray-700 appearance-none cursor-pointer"
                        disabled={structureLoading}
                    >
                        <option value="">-- เลือกระดับ --</option>
                        {Object.keys(folderStructure).map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Subject Selection */}
            <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                    เลือกวิชา
                </label>
                <div className="relative">
                    <select
                        value={selectedSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        disabled={!selectedLevel || loading}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white text-gray-700 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">-- เลือกวิชา --</option>
                        {selectedLevel && folderStructure[selectedLevel]?.map(subject => (
                            <option key={subject} value={subject}>
                                {subject.replace('.txt', '')}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {loading && (
                    <div className="flex items-center mt-3 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        กำลังโหลดข้อสอบ...
                    </div>
                )}
            </div>

            {/* Number of Questions */}
            <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                    จำนวนข้อสอบที่ต้องการ
                </label>
                <input
                    type="number"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={questions.length || 100}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white text-gray-700"
                />
                <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    ข้อสอบทั้งหมด: <span className="font-semibold ml-1 text-blue-600">{questions.length}</span> ข้อ
                </div>
            </div>

            {/* Randomize Button */}
            <button
                onClick={handleRandomizeQuestions}
                disabled={questions.length === 0 || loading}
                className="w-full bg-gradient-blue-purple hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg disabled:cursor-not-allowed"
            >
                <Target className="h-5 w-5" />
                <span>สุ่มข้อสอบ</span>
            </button>

            {/* Toggle Buttons */}
            <div className="space-y-3">
                <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`w-full p-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${showAnswers
                        ? 'bg-gradient-green text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                >
                    {showAnswers ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    <span>{showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}</span>
                </button>

                {questionStats && (
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`w-full p-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${showStats
                            ? 'from-purple-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        style={showStats ? { background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)' } : {}}
                    >
                        <BarChart3 className="h-5 w-5" />
                        <span>{showStats ? 'ซ่อนสถิติ' : 'แสดงสถิติ'}</span>
                    </button>
                )}
            </div>

            {/* Export Buttons */}
            {randomizedQuestions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">ส่งออกข้อสอบ</h4>
                    <button
                        onClick={() => handleExport('word')}
                        className="w-full p-3 bg-gradient-blue-purple text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Export Word</span>
                    </button>
                    <button
                        onClick={() => handleExport('aiken')}
                        className="w-full p-3 bg-gradient-orange text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export Moodle</span>
                    </button>
                    <button
                        onClick={() => handleExport('answers')}
                        className="w-full p-3 bg-gradient-green text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Export เฉลย</span>
                    </button>
                </div>
            )}

            {/* System Management */}
            <div className="pt-4 border-t border-gray-200">
                <button
                    onClick={initializeExamStructure}
                    disabled={structureLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center shadow-sm"
                >
                    {structureLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    รีเฟรชข้อมูล
                </button>
            </div>
        </div>
    );

    // Mobile Sidebar
    const MobileSidebar = () => (
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transition-all duration-300 overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">การตั้งค่า</h3>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <ControlPanel />
                </div>
            </div>
        </div>
    );

    // Error Display
    const ErrorDisplay = () => {
        if (!error) return null;

        return (
            <div className="mb-6 bg-red-50 border border-red-300 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center">
                    <div className="bg-red-100 text-red-600 p-3 rounded-xl mr-4">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-red-800 font-semibold text-lg">เกิดข้อผิดพลาด</h4>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%)' }}>
            {/* Modern Header */}
            <header className="bg-white backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between" style={{ height: '4rem' }}>
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-blue-purple p-2 rounded-xl">
                                <img
                                    src="/siglogo.png"
                                    alt="Logo"
                                    className="h-6 w-6"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">ระบบสุ่มข้อสอบ</h1>
                                <p className="text-sm text-gray-600 hidden sm:block">โรงเรียนทหารสื่อสาร กรมการทหารสื่อสาร</p>
                            </div>
                        </div>

                        {/* <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>ออนไลน์</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        </div> */}
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            <MobileSidebar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Display */}
                <ErrorDisplay />

                {/* Stats Dashboard */}
                {showStats && questionStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            icon={BookOpen}
                            title="ข้อสอบทั้งหมด"
                            value={questionStats.total}
                            subtitle="ข้อ"
                            color="blue"
                        />
                        <StatsCard
                            icon={TrendingUp}
                            title="ความยาวเฉลี่ย"
                            value={questionStats.averageQuestionLength}
                            subtitle="ตัวอักษร"
                            color="green"
                        />
                        <StatsCard
                            icon={Target}
                            title="ข้อสอบที่สุ่ม"
                            value={randomizedQuestions.length}
                            subtitle="ข้อ"
                            color="purple"
                        />
                        <StatsCard
                            icon={Award}
                            title="การกระจาย"
                            value={Object.keys(questionStats.answerDistribution).length}
                            subtitle="ตัวเลือก"
                            color="orange"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Desktop Control Panel */}
                    <div className="hidden lg:block lg:col-span-1">
                        <ModernCard className="p-8 sticky top-24">
                            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="bg-gradient-blue-purple p-3 rounded-xl text-white">
                                    <Settings className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">การตั้งค่า</h3>
                            </div>
                            <ControlPanel />
                        </ModernCard>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <ModernCard className="p-8">
                            {/* Content Header */}
                            <div className="text-center mb-8 pb-8 border-b border-gray-200">
                                <div className="inline-flex items-center justify-center space-x-3 mb-4">
                                    <div className="bg-gradient-blue-purple p-4 rounded-2xl text-white">
                                        <BookOpen className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800">ข้อสอบที่สุ่มได้</h2>
                                </div>
                                <p className="text-gray-600 text-lg">ระบบจัดการข้อสอบอัตโนมัติ สำหรับการประเมินผลการเรียน</p>
                            </div>

                            {/* Content Body */}
                            {structureLoading ? (
                                <div className="text-center py-16">
                                    <div className="bg-blue-50 p-8 rounded-3xl inline-block mb-6">
                                        <Loader2 className="h-16 w-16 text-blue-600 mb-4 animate-spin mx-auto" />
                                        <p className="text-lg font-medium text-gray-700">กำลังโหลดข้อมูลระบบ...</p>
                                        <p className="text-sm text-gray-500 mt-2">กรุณารอสักครู่</p>
                                    </div>
                                </div>
                            ) : randomizedQuestions.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="max-w-md mx-auto">
                                        <div className="from-blue-100 to-purple-100 p-12 rounded-3xl mb-8" style={{ background: 'linear-gradient(135deg, #dbeafe, #e9d5ff)' }}>
                                            <BookOpen className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-gray-800 mb-4">เริ่มต้นการใช้งาน</h3>
                                            <p className="text-gray-600 mb-6">เลือกระดับและวิชาที่ต้องการเพื่อเริ่มสุ่มข้อสอบ</p>

                                            <div className="space-y-3 text-left">
                                                <div className="flex items-center space-x-3 text-gray-700">
                                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                                    <span>เลือกระดับการศึกษา</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-700">
                                                    <div className="w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#8b5cf6' }}>2</div>
                                                    <span>เลือกวิชาที่ต้องการ</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-700">
                                                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                                    <span>กดปุ่มสุ่มข้อสอบ</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSidebarOpen(true)}
                                            className="lg:hidden bg-gradient-blue-purple text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                        >
                                            เริ่มใช้งาน
                                        </button>

                                        {Object.keys(folderStructure).length === 0 && !structureLoading && (
                                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                                <div className="flex items-center justify-center">
                                                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                                    <p className="text-sm text-red-700 font-medium">
                                                        ไม่พบข้อมูลข้อสอบ กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Exam Info Banner */}
                                    <div className="from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6" style={{ background: 'linear-gradient(45deg, #f0fdf4, #ecfdf5)' }}>
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-gradient-green p-3 rounded-xl text-white">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-green-800">
                                                    {selectedLevel} - {selectedSubject.replace('.txt', '')}
                                                </h3>
                                                <p className="text-green-700">
                                                    จำนวนข้อสอบที่สุ่มได้: <span className="font-bold">{randomizedQuestions.length}</span> ข้อ
                                                    จากทั้งหมด <span className="font-bold">{questions.length}</span> ข้อ
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    <div className="space-y-6">
                                        {randomizedQuestions.map((question, index) => (
                                            <QuestionCard
                                                key={`${index}-${question.question.substring(0, 20)}`}
                                                question={question}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ModernCard>
                    </div>
                </div>
            </div>

            {/* Modern Footer */}
            <footer className="bg-white backdrop-blur-xl border-t border-gray-200 mt-16" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-3">
                            <div className="bg-gradient-blue-purple p-2 rounded-lg">
                                <img
                                    src="/siglogo.png"
                                    alt="Logo"
                                    className="h-5 w-5"

                                />
                            </div>
                            <span className="text-lg font-bold text-gray-800">โรงเรียนทหารสื่อสาร</span>
                        </div>
                        <p className="text-gray-600">กรมการทหารสื่อสาร - ระบบสุ่มข้อสอบอัตโนมัติ</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ModernExamRandomizer;