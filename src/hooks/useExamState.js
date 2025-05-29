// src/hooks/useExamState.js
// Custom hook for exam state management

import { useReducer, useCallback } from 'react';

const initialState = {
    folderStructure: {},
    selectedLevel: '',
    selectedSubject: '',
    questions: [],
    randomizedQuestions: [],
    numQuestions: 10,
    showAnswers: false,
    loading: false,
    error: ''
};

const examReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload, error: '' };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_FOLDER_STRUCTURE':
            return { ...state, folderStructure: action.payload };
        case 'SET_LEVEL':
            return {
                ...state,
                selectedLevel: action.payload,
                selectedSubject: '',
                questions: [],
                randomizedQuestions: []
            };
        case 'SET_SUBJECT':
            return { ...state, selectedSubject: action.payload };
        case 'SET_QUESTIONS':
            return { ...state, questions: action.payload, randomizedQuestions: [] };
        case 'SET_RANDOMIZED_QUESTIONS':
            return { ...state, randomizedQuestions: action.payload };
        case 'SET_NUM_QUESTIONS':
            return { ...state, numQuestions: action.payload };
        case 'TOGGLE_ANSWERS':
            return { ...state, showAnswers: !state.showAnswers };
        default:
            return state;
    }
};

export const useExamState = () => {
    const [state, dispatch] = useReducer(examReducer, initialState);

    const setLevel = useCallback((level) => {
        dispatch({ type: 'SET_LEVEL', payload: level });
    }, []);

    const setSubject = useCallback((subject) => {
        dispatch({ type: 'SET_SUBJECT', payload: subject });
    }, []);

    const setQuestions = useCallback((questions) => {
        dispatch({ type: 'SET_QUESTIONS', payload: questions });
    }, []);

    const randomizeQuestions = useCallback(() => {
        const shuffled = [...state.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, state.numQuestions);
        dispatch({ type: 'SET_RANDOMIZED_QUESTIONS', payload: selected });
    }, [state.questions, state.numQuestions]);

    return {
        examState: state,
        setLevel,
        setSubject,
        setQuestions,
        randomizeQuestions,
        dispatch
    };
};

// src/hooks/useApiCache.js
// API caching hook

import { useState, useCallback } from 'react';

export const useApiCache = () => {
    const [cache, setCache] = useState(new Map());

    const getCachedData = useCallback((key) => {
        return cache.get(key);
    }, [cache]);

    const setCachedData = useCallback((key, data) => {
        setCache(prev => {
            const newCache = new Map(prev);
            newCache.set(key, {
                data,
                timestamp: Date.now()
            });
            return newCache;
        });
    }, []);

    const clearCache = useCallback((key) => {
        if (key) {
            setCache(prev => {
                const newCache = new Map(prev);
                newCache.delete(key);
                return newCache;
            });
        } else {
            setCache(new Map());
        }
    }, []);

    return {
        getCachedData,
        setCachedData,
        clearCache
    };
};

// src/hooks/useDebounce.js
// Debounce hook for search optimization

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// src/hooks/useLocalStorage.js
// Local storage hook with error handling

import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};

// src/hooks/useInfiniteScroll.js
// Infinite scroll hook for large datasets

import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (items, itemsPerPage = 20) => {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const startIndex = 0;
        const endIndex = page * itemsPerPage;
        const newDisplayedItems = items.slice(startIndex, endIndex);

        setDisplayedItems(newDisplayedItems);
        setHasMore(endIndex < items.length);
    }, [items, page, itemsPerPage]);

    const loadMore = useCallback(() => {
        if (hasMore) {
            setPage(prevPage => prevPage + 1);
        }
    }, [hasMore]);

    const reset = useCallback(() => {
        setPage(1);
        setDisplayedItems([]);
        setHasMore(true);
    }, []);

    return {
        displayedItems,
        hasMore,
        loadMore,
        reset
    };
};

// src/hooks/usePerformanceMonitor.js
// Performance monitoring hook

import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
    const renderCount = useRef(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current += 1;

        const renderTime = Date.now() - startTime.current;

        if (process.env.NODE_ENV === 'development') {
            console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`);
        }

        startTime.current = Date.now();
    });

    return {
        renderCount: renderCount.current
    };
};