import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import moment from 'moment-timezone';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      Reg_email,
      Reg_stid,
      Reg_password,
      Reg_firstname,
      Reg_lastname,
    } = body;

    // ตรวจสอบว่าข้อมูลครบหรือไม่
    if (!Reg_email || !Reg_stid || !Reg_password || !Reg_firstname || !Reg_lastname) {
        return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี email หรือ student_id ในฐานข้อมูลหรือไม่
    const [existingUser] = await db.query(
        `SELECT * FROM rc_accounts WHERE rc_ac_email = ? OR rc_ac_student_id = ?`,
        [Reg_email, Reg_stid]
      );
  
      if (existingUser.length > 0) {
        return NextResponse.json(
          { success: false, message: 'อีเมลหรือรหัสนักศึกษานี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }

    // ค่าเริ่มต้นเพิ่มเติม
    const user_img = "/user_img/default.png"; // รูปโปรไฟล์เริ่มต้น
    const permission = 2; // สิทธิ์ผู้ใช้ทั่วไป

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(Reg_password, 10);

    // สร้าง token_reg (key สำหรับยืนยันอีเมล)
    const token = crypto.randomBytes(32).toString('hex');

    // เวลาประเทศไทย
    const registrationDate = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');

    // บันทึกข้อมูลในฐานข้อมูล
    const [result] = await db.query(
      `INSERT INTO rc_accounts (rc_ac_student_id, rc_ac_email, rc_ac_password, rc_ac_name, rc_ac_lastname, rc_ac_img, rc_ac_permissions, rc_ac_create_date, rc_ac_token_reg, rc_ac_token_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Reg_stid,
        Reg_email,
        hashedPassword,
        Reg_firstname,
        Reg_lastname,
        user_img,
        permission,
        registrationDate,
        token,
        2, // token_status = 2 (ยังไม่ได้ยืนยัน)
      ]
    );

    // ส่งอีเมลยืนยัน
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // ใช้ TLS
        auth: {
            user: 'ubu.recommend@gmail.com',
            pass: 'dbxy qzsg pzlz wbox',
        },
        // debug: true, // เปิด debug mode
        // logger: true, // Log รายละเอียดของ SMTP
    });

    const verificationLink = `http://localhost:3000/auth/verify?token=${token}`; // ลิงก์ยืนยัน
    const mailOptions = {
        from: 'ubu.recommend@gmail.com',
        to: Reg_email,
        subject: 'ยืนยันการสมัครสมาชิก',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #4CAF50;">ยืนยันการสมัครสมาชิก</h2>
            <p>สวัสดีคุณ <strong>${Reg_firstname} ${Reg_lastname}</strong>,</p>
            <p style="line-height: 1.6;">ขอบคุณที่สมัครสมาชิกกับเรา กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันการสมัครสมาชิกของคุณ:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">ยืนยันการสมัครสมาชิก</a>
            </div>
            <p style="font-size: 12px; color: #888;">หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยอีเมลฉบับนี้</p>
            <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
              © 2025 UBU Recommendation System
            </footer>
          </div>
        `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'สมัครสมาชิกสำเร็จ โปรดยืนยันอีเมลของคุณ' });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
