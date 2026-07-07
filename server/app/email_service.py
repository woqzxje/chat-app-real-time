import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

def send_otp_email(recipient_email: str, otp_code: str, subject: str = "Mã xác thực OTP từ ChatITC", context: str = "Đăng ký tài khoản"):
    """
    Gửi email OTP 6 số đẹp mắt bằng HTML.
    """
    load_dotenv() # Tải lại biến môi trường để không cần restart server
    EMAIL_SENDER = os.environ.get("EMAIL_SENDER")
    EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD")

    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        print("CẢNH BÁO: Chưa cấu hình EMAIL_SENDER hoặc EMAIL_PASSWORD trong file .env")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"ChatITC Admin <{EMAIL_SENDER}>"
        msg['To'] = recipient_email
        msg['Subject'] = subject

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #0f172a;
                    color: #fff;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #1e293b;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
                    padding: 30px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    color: white;
                    font-size: 28px;
                    letter-spacing: 1px;
                }}
                .content {{
                    padding: 40px 30px;
                    text-align: center;
                }}
                .content p {{
                    font-size: 16px;
                    color: #cbd5e1;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }}
                .otp-box {{
                    background-color: #0f172a;
                    border: 2px dashed #0ea5e9;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 30px 0;
                    display: inline-block;
                }}
                .otp-code {{
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #0ea5e9;
                    margin: 0;
                }}
                .footer {{
                    background-color: #0f172a;
                    padding: 20px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                }}
                .highlight {{
                    color: #38bdf8;
                    font-weight: 600;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>ChatITC</h1>
                </div>
                <div class="content">
                    <h2 style="color: #f8fafc; margin-top: 0;">Xin chào,</h2>
                    <p>Bạn vừa yêu cầu mã OTP để <span class="highlight">{context}</span> trên hệ thống ChatITC.</p>
                    <p>Vui lòng nhập mã gồm 6 chữ số dưới đây (Mã có hiệu lực trong 5 phút):</p>
                    
                    <div class="otp-box">
                        <p class="otp-code">{otp_code}</p>
                    </div>
                    
                    <p style="font-size: 14px; color: #94a3b8;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và không chia sẻ mã cho bất kỳ ai.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 ChatITC. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, 'html'))
        
        # Thử sử dụng cổng 465 (SSL) thay vì 587 (TLS) để hy vọng xuyên qua tường lửa của Render
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print("Lỗi gửi email:", str(e))
        return False
