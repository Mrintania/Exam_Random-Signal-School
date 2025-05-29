// src/components/OptimizedExamRandomizer.js
// Performance Optimized Version

import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import {
    Download, RefreshCw, FileText, BookOpen, AlertCircle,
    Loader2, BarChart3, GraduationCap, Shield, CheckCircle2,
    Users, Settings, Target, Eye, EyeOff, Menu, X
} from 'lucide-react';

// Lazy load heavy components
const StatsPanel = lazy(() => import('./StatsPanel'));
const QuestionPreview = lazy(() => import('./QuestionPreview'));
const ExportModal = lazy(() => import('./ExportModal'));

// Custom hooks for better state management
import { useExamState } from '../hooks/useExamState';
import { useApiCache } from '../hooks/useApiCache';
import { useDebounce } from '../hooks/useDebounce';

const OptimizedExamRandomizer = () => {
    // Optimized state management with custom hooks
    const {
        examState,
        setLevel,
        setSubject,
        setQuestions,
        randomizeQuestions,
        loading,
        error
    } = useExamState();

    // API caching hook
    const {
        getCachedData,
        setCachedData,
        clearCache
    } = useApiCache();

    // Debounced search
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Memoized filtered questions
    const filteredQuestions = useMemo(() => {
        if (!debouncedSearch) return examState.questions;

        return examState.questions.filter(q =>
            q.question.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            q.options.some(opt => opt.toLowerCase().includes(debouncedSearch.toLowerCase()))
        );
    }, [examState.questions, debouncedSearch]);

    // Memoized stats calculation
    const questionStats = useMemo(() => {
        if (examState.questions.length === 0) return null;

        return {
            total: examState.questions.length,
            filtered: filteredQuestions.length,
            answerDistribution: examState.questions.reduce((acc, q) => {
                acc[q.answer] = (acc[q.answer] || 0) + 1;
                return acc;
            }, {}),
            avgLength: Math.round(
                examState.questions.reduce((sum, q) => sum + q.question.length, 0)
                / examState.questions.length
            )
        };
    }, [examState.questions, filteredQuestions.length]);

    // Optimized API calls with caching
    const loadExamStructure = useCallback(async () => {
        const cacheKey = 'exam-structure';
        const cached = getCachedData(cacheKey);

        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
            return cached.data;
        }

        try {
            const response = await fetch('http://localhost:3001/api/exam-structure');
            const data = await response.json();

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            throw new Error('ไม่สามารถโหลดโครงสร้างข้อสอบได้');
        }
    }, [getCachedData, setCachedData]);

    // Virtual scrolling for large question lists
    const VirtualizedQuestionList = React.memo(({ questions, onQuestionSelect }) => {
        const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

        const handleScroll = useCallback((e) => {
            const scrollTop = e.target.scrollTop;
            const itemHeight = 100; // approximate height per question
            const containerHeight = e.target.clientHeight;

            const start = Math.floor(scrollTop / itemHeight);
            const end = Math.min(
                start + Math.ceil(containerHeight / itemHeight) + 5, // buffer
                questions.length
            );

            setVisibleRange({ start, end });
        }, [questions.length]);

        const visibleQuestions = questions.slice(visibleRange.start, visibleRange.end);

        return (
            <div
                className="h-96 overflow-y-auto"
                onScroll={handleScroll}
            >
                <div style={{ height: visibleRange.start * 100 }} />
                {visibleQuestions.map((question, index) => (
                    <QuestionCard
                        key={visibleRange.start + index}
                        question={question}
                        index={visibleRange.start + index}
                        onClick={() => onQuestionSelect(question)}
                    />
                ))}
                <div style={{ height: (questions.length - visibleRange.end) * 100 }} />
            </div>
        );
    });

    return (
        <div className="optimized-exam-randomizer">
            {/* Search Bar */}
            <div className="search-section mb-6">
                <input
                    type="text"
                    placeholder="ค้นหาข้อสอบ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl"
                />
                {debouncedSearch && (
                    <p className="text-sm text-gray-600 mt-2">
                        พบ {filteredQuestions.length} ข้อจาก {examState.questions.length} ข้อ
                    </p>
                )}
            </div>

            {/* Lazy loaded components */}
            <Suspense fallback={<div className="loading-spinner">กำลังโหลด...</div>}>
                {questionStats && (
                    <StatsPanel stats={questionStats} />
                )}

                <VirtualizedQuestionList
                    questions={filteredQuestions}
                    onQuestionSelect={(question) => {
                        // Handle question selection
                    }}
                />
            </Suspense>
        </div>
    );
};

export default OptimizedExamRandomizer;