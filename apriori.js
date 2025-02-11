const express = require('express');
const { exec } = require('child_process');

const app = express();
const cors = require('cors');

app.use(cors()); // ใช้ middleware CORS สำหรับ cross-origin requests

// Endpoint หลัก
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Endpoint สำหรับรัน WEKA CLI และส่งผลลัพธ์กลับ
app.get('/api/association-rules', (req, res) => {
  // ตั้งค่า path ไฟล์และพารามิเตอร์
  const filePath = '/public/excel/General_Science.csv';
  const confidence = req.query.confidence || 0.9; // เริ่มต้นค่าความมั่นใจที่ 0.9
  const support = req.query.support || 0.1; // เริ่มต้นค่า support ที่ 0.1

  // สร้างคำสั่ง command line
  const command = `java -cp Weka-3-8-6/weka.jar weka.associations.Apriori -t ${filePath} -N 10 -C ${confidence} -S ${support}`;

  // รันคำสั่ง WEKA CLI
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).send(`Stderr: ${stderr}`);
    }
    // ส่งผลลัพธ์กลับไปยัง client
    res.send(stdout);
  });
});

// ระบุ port และเริ่ม server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
