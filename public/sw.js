// public/sw.js
// Service Worker for PWA and offline functionality

const CACHE_NAME = 'exam-randomizer-v1.0.0';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    '/siglogo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.destination === 'document') {
                    return caches.match('/offline.html');
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    try {
        const offlineData = await getOfflineData();
        if (offlineData.length > 0) {
            await syncToServer(offlineData);
            await clearOfflineData();
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// src/utils/offlineManager.js
// Offline data management

class OfflineManager {
    constructor() {
        this.dbName = 'ExamRandomizerDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                const examStore = db.createObjectStore('exams', { keyPath: 'id', autoIncrement: true });
                examStore.createIndex('level', 'level', { unique: false });
                examStore.createIndex('subject', 'subject', { unique: false });

                const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                sessionStore.createIndex('date', 'date', { unique: false });

                const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            };
        });
    }

    async saveExamData(level, subject, questions) {
        const transaction = this.db.transaction(['exams'], 'readwrite');
        const store = transaction.objectStore('exams');

        const examData = {
            level,
            subject,
            questions,
            lastUpdated: new Date().toISOString()
        };

        return store.put(examData);
    }

    async getExamData(level, subject) {
        const transaction = this.db.transaction(['exams'], 'readonly');
        const store = transaction.objectStore('exams');
        const index = store.index('level');

        return new Promise((resolve, reject) => {
            const request = index.getAll(level);
            request.onsuccess = () => {
                const results = request.result.filter(exam => exam.subject === subject);
                resolve(results[0] || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSession(sessionData) {
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');

        const session = {
            ...sessionData,
            date: new Date().toISOString(),
            synced: false
        };

        return store.add(session);
    }

    async getUnsyncedSessions() {
        const transaction = this.db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const unsynced = request.result.filter(session => !session.synced);
                resolve(unsynced);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        return store.put({ key, value });
    }

    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// src/hooks/useOffline.js
// Hook for offline functionality

import { useState, useEffect } from 'react';

export const useOffline = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineManager] = useState(new OfflineManager());

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initialize offline manager
        offlineManager.init().catch(console.error);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [offlineManager]);

    const saveForOffline = async (type, data) => {
        try {
            switch (type) {
                case 'exam':
                    await offlineManager.saveExamData(data.level, data.subject, data.questions);
                    break;
                case 'session':
                    await offlineManager.saveSession(data);
                    break;
                case 'setting':
                    await offlineManager.saveSetting(data.key, data.value);
                    break;
            }
        } catch (error) {
            console.error('Error saving offline data:', error);
        }
    };

    const loadFromOffline = async (type, params) => {
        try {
            switch (type) {
                case 'exam':
                    return await offlineManager.getExamData(params.level, params.subject);
                case 'sessions':
                    return await offlineManager.getUnsyncedSessions();
                case 'setting':
                    return await offlineManager.getSetting(params.key);
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error loading offline data:', error);
            return null;
        }
    };

    return {
        isOnline,
        offlineManager,
        saveForOffline,
        loadFromOffline
    };
};

// src/components/OfflineIndicator.js
// Offline status indicator

import React from 'react';
import { Wifi, WifiOff, Download, Upload } from 'lucide-react';

const OfflineIndicator = ({ isOnline, unsyncedCount = 0 }) => {
    if (isOnline && unsyncedCount === 0) {
        return (
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <Wifi className="h-4 w-4" />
                <span>ออนไลน์</span>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <WifiOff className="h-4 w-4" />
                <span>ออฟไลน์</span>
            </div>
        );
    }

    if (unsyncedCount > 0) {
        return (
            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                <Upload className="h-4 w-4" />
                <span>ข้อมูลรอซิงค์ {unsyncedCount}</span>
            </div>
        );
    }

    return null;
};

// Enhanced manifest.json for PWA
const enhancedManifest = {
    "name": "ระบบสุ่มข้อสอบ - โรงเรียนทหารสื่อสาร",
    "short_name": "Exam Randomizer",
    "description": "ระบบสุ่มข้อสอบสำหรับโรงเรียนทหารสื่อสาร กรมการทหารสื่อสาร",
    "icons": [
        {
            "src": "siglogo.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "siglogo.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "theme_color": "#3b82f6",
    "background_color": "#ffffff",
    "categories": ["education", "productivity"],
    "lang": "th",
    "dir": "ltr",
    "shortcuts": [
        {
            "name": "สุ่มข้อสอบ",
            "short_name": "สุ่ม",
            "description": "เริ่มสุ่มข้อสอบใหม่",
            "url": "/?action=randomize",
            "icons": [{ "src": "siglogo.png", "sizes": "96x96" }]
        },
        {
            "name": "ทดสอบออนไลน์",
            "short_name": "ทดสอบ",
            "description": "เริ่มทดสอบแบบออนไลน์",
            "url": "/?action=quiz",
            "icons": [{ "src": "siglogo.png", "sizes": "96x96" }]
        }
    ],
    "screenshots": [
        {
            "src": "screenshot1.png",
            "sizes": "1280x720",
            "type": "image/png"
        }
    ]
};

export { OfflineManager, OfflineIndicator, enhancedManifest };