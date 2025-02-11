import mysql.connector
import pandas as pd
import json

# โหลดข้อมูลจากไฟล์ JSON
file_path = 'genearal_sci.json'  # ปรับเส้นทางไฟล์ของคุณ
with open(file_path, 'r') as file:
    data = json.load(file)

# สร้าง DataFrame
df = pd.DataFrame(data)

# พารามิเตอร์การเชื่อมต่อ
config = {
    'user': 'root',
    'password': 'Admin@123',
    'host': 'localhost',
    'database': 'recommend_system',
    'raise_on_warnings': True
}

# เชื่อมต่อกับฐานข้อมูล MySQL
conn = mysql.connector.connect(**config)
cursor = conn.cursor()

# คำสั่ง SQL สำหรับการแทรกข้อมูล
insert_query = '''
INSERT INTO rc_association_json 
    (rc_as_js_rule, 
     rc_as_js_min_support, 
     rc_as_js_min_confident, 
     rc_as_js_reassamples, 
     rc_as_js_GroupAsso_pid
    )
VALUES (%s, %s, %s, %s, %s)
'''

# วนลูปผ่าน DataFrame และแทรกแต่ละแถว
for _, row in df.iterrows():
    rule_data = json.dumps(row.to_dict())
    values_to_insert = (rule_data, 0.1, 0.85, 500, 1)
    cursor.execute(insert_query, values_to_insert)

# ยืนยันการเปลี่ยนแปลงและปิดการเชื่อมต่อ
conn.commit()
cursor.close()
conn.close()

print("Data has been successfully inserted into the database.")
