import pandas as pd
import os

# 바탕화면 경로 설정
desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
file_name = "card_raw_logs_v2.csv"
full_path = os.path.join(desktop_path, file_name)

# 실무형 로그 데이터 (다양한 컬럼 포함)
data = [
    # [유저ID, 세션ID, 이벤트명, 발생시간, 디바이스, OS, 지역, 유입경로]
    ["user_1", "S101", "view_landing", "2024-03-01 10:00:01", "iPhone15", "iOS", "Seoul", "google_ad"],
    ["user_1", "S101", "click_benefits", "2024-03-01 10:05:20", "iPhone15", "iOS", "Seoul", "google_ad"],
    ["user_1", "S101", "start_auth", "2024-03-01 10:10:45", "iPhone15", "iOS", "Seoul", "google_ad"],
    ["user_1", "S101", "submit_form", "2024-03-01 10:15:10", "iPhone15", "iOS", "Seoul", "google_ad"],
    ["user_1", "S101", "complete_issued", "2024-03-01 10:20:05", "iPhone15", "iOS", "Seoul", "google_ad"],
    
    ["user_2", "S102", "view_landing", "2024-03-01 11:00:00", "GalaxyS24", "Android", "Busan", "facebook"],
    ["user_2", "S102", "click_benefits", "2024-03-01 11:10:30", "GalaxyS24", "Android", "Busan", "facebook"],
    
    ["user_3", "S103", "view_landing", "2024-03-01 12:00:00", "iPhone13", "iOS", "Incheon", "direct"],
    ["user_3", "S103", "click_benefits", "2024-03-01 12:05:00", "iPhone13", "iOS", "Incheon", "direct"],
    ["user_3", "S103", "start_auth", "2024-03-01 12:30:00", "iPhone13", "iOS", "Incheon", "direct"],
    
    ["user_4", "S104", "click_benefits", "2024-03-01 13:00:00", "GalaxyS22", "Android", "Seoul", "naver"], # 이탈 후보 (랜딩 없음)
    
    ["user_5", "S105", "view_landing", "2024-03-02 09:00:00", "iPhone14", "iOS", "Gwangju", "google_ad"],
    ["user_5", "S105", "click_benefits", "2024-03-02 09:10:00", "iPhone14", "iOS", "Gwangju", "google_ad"],
    ["user_5", "S105", "start_auth", "2024-03-02 09:20:00", "iPhone14", "iOS", "Gwangju", "google_ad"],
    ["user_5", "S105", "submit_form", "2024-03-02 09:30:00", "iPhone14", "iOS", "Gwangju", "google_ad"],
    ["user_5", "S105", "complete_issued", "2024-03-02 09:40:00", "iPhone14", "iOS", "Gwangju", "google_ad"],
    
    ["user_6", "S106", "view_landing", "2024-03-02 10:00:00", "GalaxyS23", "Android", "Seoul", "google_ad"],
    ["user_7", "S107", "view_landing", "2024-03-02 11:00:00", "iPhone15Pro", "iOS", "Seoul", "instagram"],
    ["user_8", "S108", "view_landing", "2024-03-02 12:00:00", "GalaxyFlip5", "Android", "Daegu", "naver"],
    ["user_9", "S109", "view_landing", "2024-03-02 13:00:00", "iPhone15", "iOS", "Seoul", "direct"],
    ["user_10", "S110", "view_landing", "2024-03-02 14:00:00", "GalaxyS24", "Android", "Suwon", "facebook"]
]

df = pd.DataFrame(data, columns=["user_id", "session_id", "event_type", "event_ts", "device", "os", "city", "utm_source"])
df.to_csv(full_path, index=False, encoding='utf-8-sig')

print(f"✅ 실무형 로그 '{file_name}' 생성 완료!")
