// src/utils/aiAnalytics.js
// AI-powered question analysis and recommendations

class AIQuestionAnalyzer {
    constructor() {
        this.difficultyKeywords = {
            easy: ['คือ', 'หมายถึง', 'เรียกว่า', 'ประกอบด้วย'],
            medium: ['วิธีการ', 'ขั้นตอน', 'เปรียบเทียบ', 'แตกต่าง'],
            hard: ['วิเคราะห์', 'ประเมิน', 'สังเคราะห์', 'อธิบายความสัมพันธ์']
        };

        this.categoryKeywords = {
            'ทฤษฎี': ['หลักการ', 'ทฤษฎี', 'แนวคิด', 'นิยาม'],
            'ปฏิบัติ': ['วิธีการ', 'ขั้นตอน', 'การปฏิบัติ', 'เทคนิค'],
            'วิเคราะห์': ['วิเคราะห์', 'เปรียบเทียบ', 'ประเมิน', 'สรุป'],
            'จำ': ['เท่าไร', 'กี่', 'ปีใด', 'ชื่อ']
        };
    }

    // วิเคราะห์ระดับความยากของข้อสอบ
    analyzeDifficulty(question) {
        const text = question.question.toLowerCase();
        let difficultyScore = 0;

        // Check for difficulty indicators
        for (const [level, keywords] of Object.entries(this.difficultyKeywords)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            switch (level) {
                case 'easy':
                    difficultyScore += matches * 1;
                    break;
                case 'medium':
                    difficultyScore += matches * 2;
                    break;
                case 'hard':
                    difficultyScore += matches * 3;
                    break;
            }
        }

        // Analyze question length (longer questions tend to be harder)
        const lengthScore = Math.min(question.question.length / 100, 2);
        difficultyScore += lengthScore;

        // Analyze option complexity
        const avgOptionLength = question.options.reduce((sum, opt) => sum + opt.length, 0) / 4;
        const optionScore = Math.min(avgOptionLength / 50, 1);
        difficultyScore += optionScore;

        // Return difficulty level
        if (difficultyScore <= 2) return 'ง่าย';
        if (difficultyScore <= 4) return 'ปานกลาง';
        return 'ยาก';
    }

    // จัดหมวดหมู่ข้อสอบ
    categorizeQuestion(question) {
        const text = question.question.toLowerCase();
        let bestCategory = 'ทั่วไป';
        let maxScore = 0;

        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        return bestCategory;
    }

    // วิเคราะห์คุณภาพของข้อสอบ
    analyzeQuality(question) {
        const issues = [];
        const suggestions = [];

        // Check question length
        if (question.question.length < 20) {
            issues.push('คำถามสั้นเกินไป');
            suggestions.push('เพิ่มรายละเอียดในคำถามให้ชัดเจนขึ้น');
        } else if (question.question.length > 200) {
            issues.push('คำถามยาวเกินไป');
            suggestions.push('ลดความซับซ้อนของคำถาม');
        }

        // Check option length balance
        const optionLengths = question.options.map(opt => opt.length);
        const maxLength = Math.max(...optionLengths);
        const minLength = Math.min(...optionLengths);

        if (maxLength / minLength > 3) {
            issues.push('ตัวเลือกไม่สมดุล');
            suggestions.push('ปรับความยาวของตัวเลือกให้ใกล้เคียงกัน');
        }

        // Check for obvious wrong answers
        const shortOptions = question.options.filter(opt => opt.length < 10);
        if (shortOptions.length > 1) {
            issues.push('มีตัวเลือกที่สั้นผิดปกติ');
            suggestions.push('ตรวจสอบตัวเลือกที่อาจเป็นคำตอบที่ไม่น่าเชื่อถือ');
        }

        return {
            score: Math.max(0, 100 - (issues.length * 20)),
            issues,
            suggestions
        };
    }

    // แนะนำข้อสอบที่เหมาะสม
    recommendQuestions(allQuestions, targetDifficulty = 'ปานกลาง', targetCount = 10) {
        // Analyze all questions
        const analyzedQuestions = allQuestions.map(q => ({
            ...q,
            difficulty: this.analyzeDifficulty(q),
            category: this.categorizeQuestion(q),
            quality: this.analyzeQuality(q)
        }));

        // Filter by quality (score >= 70)
        const qualityQuestions = analyzedQuestions.filter(q => q.quality.score >= 70);

        // Group by difficulty
        const difficultyGroups = qualityQuestions.reduce((groups, q) => {
            if (!groups[q.difficulty]) groups[q.difficulty] = [];
            groups[q.difficulty].push(q);
            return groups;
        }, {});

        // Create balanced selection
        const recommended = [];
        const easyCount = Math.floor(targetCount * 0.3);
        const mediumCount = Math.floor(targetCount * 0.5);
        const hardCount = targetCount - easyCount - mediumCount;

        // Select questions by difficulty
        if (difficultyGroups['ง่าย']) {
            recommended.push(...this.selectRandom(difficultyGroups['ง่าย'], easyCount));
        }
        if (difficultyGroups['ปานกลาง']) {
            recommended.push(...this.selectRandom(difficultyGroups['ปานกลาง'], mediumCount));
        }
        if (difficultyGroups['ยาก']) {
            recommended.push(...this.selectRandom(difficultyGroups['ยาก'], hardCount));
        }

        // Fill remaining slots with any quality questions
        while (recommended.length < targetCount && qualityQuestions.length > recommended.length) {
            const remaining = qualityQuestions.filter(q => !recommended.includes(q));
            if (remaining.length > 0) {
                recommended.push(remaining[Math.floor(Math.random() * remaining.length)]);
            } else {
                break;
            }
        }

        return recommended.slice(0, targetCount);
    }

    selectRandom(array, count) {
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // สร้างรายงานการวิเคราะห์
    generateAnalysisReport(questions) {
        const analyzed = questions.map(q => ({
            ...q,
            difficulty: this.analyzeDifficulty(q),
            category: this.categorizeQuestion(q),
            quality: this.analyzeQuality(q)
        }));

        const report = {
            totalQuestions: questions.length,
            difficultyDistribution: {},
            categoryDistribution: {},
            qualityStats: {
                averageScore: 0,
                highQuality: 0,
                needsImprovement: 0
            },
            recommendations: []
        };

        // Calculate distributions
        analyzed.forEach(q => {
            // Difficulty distribution
            if (!report.difficultyDistribution[q.difficulty]) {
                report.difficultyDistribution[q.difficulty] = 0;
            }
            report.difficultyDistribution[q.difficulty]++;

            // Category distribution
            if (!report.categoryDistribution[q.category]) {
                report.categoryDistribution[q.category] = 0;
            }
            report.categoryDistribution[q.category]++;

            // Quality stats
            report.qualityStats.averageScore += q.quality.score;
            if (q.quality.score >= 80) {
                report.qualityStats.highQuality++;
            } else if (q.quality.score < 60) {
                report.qualityStats.needsImprovement++;
            }
        });

        report.qualityStats.averageScore = Math.round(
            report.qualityStats.averageScore / questions.length
        );

        // Generate recommendations
        if (report.qualityStats.averageScore < 70) {
            report.recommendations.push('ควรปรับปรุงคุณภาพข้อสอบโดยรวม');
        }

        if (report.difficultyDistribution['ง่าย'] > questions.length * 0.6) {
            report.recommendations.push('ควรเพิ่มข้อสอบระดับปานกลางและยาก');
        }

        if (report.difficultyDistribution['ยาก'] > questions.length * 0.4) {
            report.recommendations.push('ข้อสอบยากเกินไป ควรเพิ่มข้อสอบระดับง่าย');
        }

        return report;
    }
}

// src/components/AIAnalysisPanel.js
// AI Analysis Panel Component

import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, CheckCircle, AlertTriangle } from 'lucide-react';

const AIAnalysisPanel = ({ questions, onRecommendationsSelect }) => {
    const [analyzer] = useState(new AIQuestionAnalyzer());
    const [analysis, setAnalysis] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (questions && questions.length > 0) {
            analyzeQuestions();
        }
    }, [questions]);

    const analyzeQuestions = async () => {
        setLoading(true);
        try {
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const report = analyzer.generateAnalysisReport(questions);
            const recs = analyzer.recommendQuestions(questions, 'ปานกลาง', 15);

            setAnalysis(report);
            setRecommendations(recs);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="ai-analysis-panel bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                    <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold mb-2">AI กำลังวิเคราะห์ข้อสอบ</h3>
                    <p className="text-gray-600">กรุณารอสักครู่...</p>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="ai-analysis-panel space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                    <Brain className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold">การวิเคราะห์ด้วย AI</h3>
                </div>
                <p className="text-gray-600">
                    วิเคราะห์ {analysis.totalQuestions} ข้อสอบ ด้วยระบบปัญญาประดิษฐ์
                </p>
            </div>

            {/* Quality Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="text-xl font-bold mb-4 flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    คุณภาพโดยรวม
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">
                            {analysis.qualityStats.averageScore}%
                        </div>
                        <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-3xl font-bold text-green-600">
                            {analysis.qualityStats.highQuality}
                        </div>
                        <div className="text-sm text-gray-600">คุณภาพสูง</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                        <div className="text-3xl font-bold text-red-600">
                            {analysis.qualityStats.needsImprovement}
                        </div>
                        <div className="text-sm text-gray-600">ต้องปรับปรุง</div>
                    </div>
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                            <span className="font-semibold text-yellow-800">คำแนะนำ</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-yellow-700">
                            {analysis.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Difficulty Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="text-xl font-bold mb-4 flex items-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
                    การกระจายความยาก
                </h4>

                <div className="space-y-3">
                    {Object.entries(analysis.difficultyDistribution).map(([difficulty, count]) => {
                        const percentage = Math.round((count / analysis.totalQuestions) * 100);
                        const color =
                            difficulty === 'ง่าย' ? 'bg-green-500' :
                                difficulty === 'ปานกลาง' ? 'bg-yellow-500' : 'bg-red-500';

                        return (
                            <div key={difficulty} className="flex items-center">
                                <div className="w-20 text-sm font-medium">{difficulty}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                                    <div
                                        className={`h-4 rounded-full ${color}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="text-sm text-gray-600 w-16">
                                    {count} ข้อ ({percentage}%)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="text-xl font-bold mb-4 flex items-center">
                    <Target className="h-6 w-6 text-indigo-600 mr-2" />
                    ข้อสอบที่แนะนำ
                </h4>

                <p className="text-gray-600 mb-4">
                    AI เลือกข้อสอบที่เหมาะสมแล้ว {recommendations.length} ข้อ
                    จากการวิเคราะห์คุณภาพและระดับความยาก
                </p>

                <div className="flex space-x-3">
                    <button
                        onClick={() => onRecommendationsSelect && onRecommendationsSelect(recommendations)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center"
                    >
                        <Target className="h-5 w-5 mr-2" />
                        ใช้ข้อสอบที่แนะนำ
                    </button>

                    <button
                        onClick={analyzeQuestions}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                        วิเคราะห์ใหม่
                    </button>
                </div>
            </div>
        </div>
    );
};

export { AIQuestionAnalyzer, AIAnalysisPanel };