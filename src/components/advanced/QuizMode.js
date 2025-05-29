// src/components/advanced/QuizMode.js
// Interactive Quiz Mode

import React, { useState, useEffect, useCallback } from 'react';
import { Timer, CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';

const QuizMode = ({ questions, onComplete }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Timer
    useEffect(() => {
        if (!isCompleted) {
            const timer = setInterval(() => {
                setTimeSpent(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isCompleted]);

    const handleAnswerSelect = useCallback((answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestion]: answer
        }));
    }, [currentQuestion]);

    const handleNext = useCallback(() => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            setIsCompleted(true);
            setShowResults(true);
        }
    }, [currentQuestion, questions.length]);

    const calculateScore = useCallback(() => {
        let correct = 0;
        questions.forEach((question, index) => {
            if (selectedAnswers[index] === question.answer) {
                correct++;
            }
        });
        return {
            correct,
            total: questions.length,
            percentage: Math.round((correct / questions.length) * 100)
        };
    }, [questions, selectedAnswers]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (showResults) {
        const score = calculateScore();
        return (
            <div className="quiz-results bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center mb-8">
                    <Award className={`h-20 w-20 mx-auto mb-4 ${score.percentage >= 80 ? 'text-green-500' :
                            score.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                    <h2 className="text-3xl font-bold mb-2">ผลการทดสอบ</h2>
                    <div className="text-6xl font-bold mb-4" style={{
                        color: score.percentage >= 80 ? '#22c55e' :
                            score.percentage >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                        {score.percentage}%
                    </div>
                    <p className="text-xl text-gray-600">
                        ตอบถูก {score.correct} ข้อ จาก {score.total} ข้อ
                    </p>
                    <p className="text-lg text-gray-500">
                        ใช้เวลา: {formatTime(timeSpent)}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {questions.map((question, index) => (
                        <div key={index} className={`p-4 rounded-xl border-2 ${selectedAnswers[index] === question.answer
                                ? 'border-green-300 bg-green-50'
                                : 'border-red-300 bg-red-50'
                            }`}>
                            <div className="flex items-center mb-2">
                                {selectedAnswers[index] === question.answer ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                )}
                                <span className="font-semibold">ข้อ {index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                                {question.question.substring(0, 80)}...
                            </p>
                            <div className="text-sm">
                                <span className="text-gray-600">คำตอบ: </span>
                                <span className="font-semibold text-green-600">
                                    {question.answer}
                                </span>
                                {selectedAnswers[index] !== question.answer && (
                                    <>
                                        <span className="text-gray-600"> | คุณตอบ: </span>
                                        <span className="font-semibold text-red-600">
                                            {selectedAnswers[index] || 'ไม่ได้ตอบ'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => {
                            setCurrentQuestion(0);
                            setSelectedAnswers({});
                            setTimeSpent(0);
                            setIsCompleted(false);
                            setShowResults(false);
                        }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        ทำแบบทดสอบใหม่
                    </button>
                    <button
                        onClick={() => onComplete && onComplete(score)}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                        เสร็จสิ้น
                    </button>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="quiz-mode bg-white rounded-2xl p-8 shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Timer className="h-6 w-6 text-blue-600" />
                    <span className="text-lg font-semibold">{formatTime(timeSpent)}</span>
                </div>
                <div className="text-lg font-semibold">
                    ข้อ {currentQuestion + 1} / {questions.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question */}
            <div className="mb-8">
                <h3 className="text-2xl font-bold mb-6 leading-relaxed">
                    {question.question}
                </h3>

                <div className="space-y-4">
                    {question.options.map((option, index) => {
                        const optionLabel = ['ก', 'ข', 'ค', 'ง'][index];
                        const isSelected = selectedAnswers[currentQuestion] === optionLabel;

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(optionLabel)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-colors ${isSelected ? 'bg-blue-600' : 'bg-gray-500'
                                        }`}>
                                        {optionLabel}
                                    </div>
                                    <span className="text-gray-700 flex-1">
                                        {option}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ก่อนหน้า
                </button>
                <button
                    onClick={handleNext}
                    disabled={!selectedAnswers[currentQuestion]}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {currentQuestion === questions.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
                </button>
            </div>
        </div>
    );
};

// src/components/advanced/BatchImport.js
// Batch import questions from multiple files

const BatchImport = ({ onImportComplete }) => {
    const [files, setFiles] = useState([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
    };

    const processFiles = async () => {
        setImporting(true);
        const allQuestions = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProgress(((i + 1) / files.length) * 100);

            try {
                const text = await file.text();
                const questions = parseQuestions(text);
                allQuestions.push(...questions);
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }

        setImporting(false);
        onImportComplete && onImportComplete(allQuestions);
    };

    return (
        <div className="batch-import bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6">นำเข้าข้อสอบจากหลายไฟล์</h3>

            <div className="mb-6">
                <input
                    type="file"
                    multiple
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl"
                />
                {files.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                        เลือกแล้ว {files.length} ไฟล์
                    </p>
                )}
            </div>

            {importing && (
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-center mt-2 text-sm text-gray-600">
                        กำลังประมวลผล... {Math.round(progress)}%
                    </p>
                </div>
            )}

            <button
                onClick={processFiles}
                disabled={files.length === 0 || importing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {importing ? 'กำลังนำเข้า...' : 'เริ่มนำเข้า'}
            </button>
        </div>
    );
};

// src/components/advanced/AnalyticsDashboard.js
// Analytics and reporting dashboard

const AnalyticsDashboard = ({ examHistory }) => {
    const getUsageStats = () => {
        if (!examHistory || examHistory.length === 0) return null;

        const totalSessions = examHistory.length;
        const totalQuestions = examHistory.reduce((sum, session) => sum + session.questionsCount, 0);
        const averageScore = examHistory.reduce((sum, session) => sum + session.score, 0) / totalSessions;

        const subjectStats = examHistory.reduce((acc, session) => {
            const subject = session.subject;
            if (!acc[subject]) {
                acc[subject] = { count: 0, totalScore: 0 };
            }
            acc[subject].count++;
            acc[subject].totalScore += session.score;
            return acc;
        }, {});

        return {
            totalSessions,
            totalQuestions,
            averageScore: Math.round(averageScore),
            subjectStats
        };
    };

    const stats = getUsageStats();

    if (!stats) return null;

    return (
        <div className="analytics-dashboard">
            <h3 className="text-2xl font-bold mb-6">สถิติการใช้งาน</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
                    <div className="text-gray-600">ครั้งที่ใช้งาน</div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                    <div className="text-3xl font-bold text-green-600">{stats.totalQuestions}</div>
                    <div className="text-gray-600">ข้อสอบที่ทำ</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{stats.averageScore}%</div>
                    <div className="text-gray-600">คะแนนเฉลี่ย</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h4 className="text-xl font-bold mb-4">สถิติแยกตามวิชา</h4>
                {Object.entries(stats.subjectStats).map(([subject, data]) => (
                    <div key={subject} className="flex justify-between items-center p-3 border-b border-gray-200">
                        <span className="font-semibold">{subject}</span>
                        <div className="text-right">
                            <div className="text-lg font-bold">{Math.round(data.totalScore / data.count)}%</div>
                            <div className="text-sm text-gray-600">{data.count} ครั้ง</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export { QuizMode, BatchImport, AnalyticsDashboard };