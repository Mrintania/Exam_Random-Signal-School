// src/reportWebVitals.js
// Performance monitoring สำหรับระบบสุ่มข้อสอบ

/**
 * ฟังก์ชันสำหรับวัดและรายงานประสิทธิภาพของเว็บแอปพลิเคชัน
 * ใช้ Web Vitals API เพื่อวัดค่าต่างๆ ที่สำคัญต่อประสบการณ์ผู้ใช้
 * 
 * @param {Function} onPerfEntry - ฟังก์ชันที่จะรับค่าการวัดประสิทธิภาพ
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cumulative Layout Shift (CLS)
      // วัดการเปลี่ยนแปลงการจัดวางองค์ประกอบบนหน้าเว็บ
      getCLS(onPerfEntry);

      // First Input Delay (FID)  
      // วัดเวลาตอบสนองเมื่อผู้ใช้โต้ตอบครั้งแรก
      getFID(onPerfEntry);

      // First Contentful Paint (FCP)
      // วัดเวลาในการแสดงเนื้อหาแรกบนหน้าจอ
      getFCP(onPerfEntry);

      // Largest Contentful Paint (LCP)
      // วัดเวลาในการแสดงเนื้อหาหลักที่ใหญ่ที่สุด
      getLCP(onPerfEntry);

      // Time to First Byte (TTFB)
      // วัดเวลาในการรับข้อมูลไบต์แรกจากเซิร์ฟเวอร์
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;