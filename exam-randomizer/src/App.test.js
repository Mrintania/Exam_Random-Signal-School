// src/App.test.js
// Test cases สำหรับระบบสุ่มข้อสอบ - โรงเรียนทหารสื่อสาร

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch สำหรับการทดสอบ API calls
global.fetch = jest.fn();

describe('Exam Randomizer Application', () => {
  beforeEach(() => {
    // รีเซ็ต fetch mock ก่อนแต่ละ test
    fetch.mockClear();
  });

  afterEach(() => {
    // ทำความสะอาดหลังแต่ละ test
    jest.clearAllMocks();
  });

  test('renders main application title', () => {
    // Mock API response สำหรับ exam structure
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามี title หลักของแอปพลิเคชัน
    const titleElement = screen.getByText(/ระบบสุ่มข้อสอบ/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders subtitle with department name', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามี subtitle ของหน่วยงาน
    const subtitleElement = screen.getByText(/กรมการทหารสื่อสาร/i);
    expect(subtitleElement).toBeInTheDocument();
  });

  test('renders level selection section', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีส่วนการเลือกระดับ
    const levelSectionElement = screen.getByText(/เลือกระดับและวิชา/i);
    expect(levelSectionElement).toBeInTheDocument();
  });

  test('renders question display section', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีส่วนแสดงข้อสอบ
    const questionSectionElement = screen.getByText(/ข้อสอบที่สุ่มได้/i);
    expect(questionSectionElement).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีสถานะ loading เมื่อเริ่มต้น
    const loadingElement = screen.getByText(/กำลังโหลดโครงสร้างโฟลเดอร์/i);
    expect(loadingElement).toBeInTheDocument();
  });

  test('renders level dropdown after loading', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        '01 ส.อ. เป็น จ.ส.อ.': ['วิชาทหารสื่อสาร.txt'],
        '02 จ.ส.อ. เป็น จ.ส.อ.(พ.)': ['คอมพิวเตอร์.txt']
      })
    });

    render(<App />);

    // รอจนกว่า loading จะเสร็จ
    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลด/i)).not.toBeInTheDocument();
    });

    // ตรวจสอบว่ามี dropdown สำหรับเลือกระดับ
    const levelDropdown = screen.getByDisplayValue('-- เลือกระดับ --');
    expect(levelDropdown).toBeInTheDocument();
  });

  test('enables subject dropdown when level is selected', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          '01 ส.อ. เป็น จ.ส.อ.': ['วิชาทหารสื่อสาร.txt']
        })
      });

    render(<App />);

    // รอจนกว่า loading จะเสร็จ
    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลด/i)).not.toBeInTheDocument();
    });

    // เลือกระดับ
    const levelDropdown = screen.getByDisplayValue('-- เลือกระดับ --');
    fireEvent.change(levelDropdown, { target: { value: '01 ส.อ. เป็น จ.ส.อ.' } });

    // ตรวจสอบว่า subject dropdown ไม่ disabled แล้ว
    const subjectDropdown = screen.getByDisplayValue('-- เลือกวิชา --');
    expect(subjectDropdown).not.toBeDisabled();
  });

  test('shows error message when API fails', async () => {
    // Mock failed API response
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    // รอจนกว่าจะแสดง error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/ไม่สามารถโหลดโครงสร้างโฟลเดอร์ได้/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  test('renders randomize button as disabled initially', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่าปุ่มสุ่มข้อสอบ disabled ในตอนแรก
    const randomizeButton = screen.getByText(/สุ่มข้อสอบ/i);
    expect(randomizeButton).toBeDisabled();
  });

  test('renders system management section', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีส่วนจัดการระบบ
    const managementSection = screen.getByText(/จัดการระบบ/i);
    expect(managementSection).toBeInTheDocument();
  });

  test('renders refresh button', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีปุ่มรีเฟรช
    const refreshButton = screen.getByText(/รีเฟรชโฟลเดอร์ข้อสอบ/i);
    expect(refreshButton).toBeInTheDocument();
  });

  test('renders number input for question count', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามี input สำหรับระบุจำนวนข้อสอบ
    const numberInput = screen.getByLabelText(/จำนวนข้อสอบที่ต้องการ/i);
    expect(numberInput).toBeInTheDocument();
    expect(numberInput).toHaveAttribute('type', 'number');
  });

  test('displays total questions count', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีการแสดงจำนวนข้อสอบทั้งหมด
    const totalCount = screen.getByText(/ข้อสอบทั้งหมด: 0 ข้อ/i);
    expect(totalCount).toBeInTheDocument();
  });

  test('calls exam structure API on component mount', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบว่ามีการเรียก API สำหรับโหลดโครงสร้างโฟลเดอร์
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/exam-structure');
  });
});

describe('Component Structure Tests', () => {
  test('has proper main container structure', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบ main container
    const mainContainer = document.querySelector('.max-w-6xl');
    expect(mainContainer).toBeInTheDocument();
  });

  test('has proper grid layout structure', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบ grid layout
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  test('has proper control panel structure', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบ control panel
    const controlPanel = document.querySelector('.lg\\:col-span-1');
    expect(controlPanel).toBeInTheDocument();
  });

  test('has proper question display panel structure', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<App />);

    // ตรวจสอบ question display panel
    const questionPanel = document.querySelector('.lg\\:col-span-2');
    expect(questionPanel).toBeInTheDocument();
  });
});

// Test สำหรับการทำงานของ utility functions (ต้องมี mock)
describe('Integration Tests', () => {
  test('handles successful exam structure loading', async () => {
    const mockData = {
      '01 ส.อ. เป็น จ.ส.อ.': ['วิชาทหารสื่อสาร.txt', 'วิชาคอมพิวเตอร์.txt']
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดโครงสร้างโฟลเดอร์/i)).not.toBeInTheDocument();
    });

    // ตรวจสอบว่าข้อมูลถูกโหลดสำเร็จ
    const levelDropdown = screen.getByDisplayValue('-- เลือกระดับ --');
    expect(levelDropdown).not.toBeDisabled();
  });

  test('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Server Error'));

    render(<App />);

    await waitFor(() => {
      const errorElement = screen.getByText(/ไม่สามารถโหลดโครงสร้างโฟลเดอร์ได้/i);
      expect(errorElement).toBeInTheDocument();
    });
  });
});