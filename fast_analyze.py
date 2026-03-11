import pandas as pd
import json
import os
from pathlib import Path

# 설정 (경로만 맞추면 끝)
EXCEL_PATH = r"C:\Users\WIN11\Desktop\card_funnel_spec.xlsx"
LOG_PATH   = r"C:\Users\WIN11\Desktop\card_raw_logs_v2.csv"
OUTPUT_SQL = r"C:\Users\WIN11\Desktop\sql-mart-builder\output\card_apply_full_analysis.sql"
OUTPUT_JSON = r"C:\Users\WIN11\Desktop\card_funnel_result.json"

def fast_run():
    print("🚀 분석 시작...")
    # 1. 엑셀 읽기
    steps_df = pd.read_excel(EXCEL_PATH, sheet_name='steps')
    config_df = pd.read_excel(EXCEL_PATH, sheet_name='config')
    
    # 2. 로그 읽기
    logs = pd.read_csv(LOG_PATH)
    logs['event_ts'] = pd.to_datetime(logs['event_ts'])
    
    # 3. 퍼널 계산 (매우 빠름)
    results = []
    current_users = None
    for i, row in steps_df.iterrows():
        ev = row['event_name']
        ev_logs = logs[logs['event_type'] == ev].sort_values('event_ts').groupby('user_id').first().reset_index()
        if i == 0:
            current_users = ev_logs[['user_id', 'event_ts']]
        else:
            ev_logs = ev_logs[['user_id', 'event_ts']]
            current_users = pd.merge(current_users, ev_logs, on='user_id', how='inner', suffixes=('_prev', '_curr'))
            current_users = current_users[current_users['event_ts_curr'] > current_users['event_ts_prev']]
            current_users = current_users.rename(columns={'event_ts_curr': 'event_ts'})[['user_id', 'event_ts']]
        
        results.append({"step": i+1, "name": row['name'], "event": ev, "users": int(len(current_users))})

    # CVR 계산
    for i in range(len(results)):
        results[i]['step_cvr'] = 100.0 if i==0 else round((results[i]['users']/results[i-1]['users'])*100, 1)
        results[i]['total_cvr'] = round((results[i]['users']/results[0]['users'])*100, 1)

    # 4. JSON 저장 (UI용)
    final_data = {
        "mart_name": "Card_Apply_Analysis",
        "total_users": int(logs['user_id'].nunique()),
        "total_events": int(len(logs)),
        "overall_cvr": results[-1]['total_cvr'],
        "funnel_steps": results,
        "source_file": "card_raw_logs_v2.csv",
        "start_date": "2024-03-01", "end_date": "2024-03-31",
        "os_breakdown": logs.groupby('os')['user_id'].nunique().to_dict(),
        "utm_breakdown": logs.pivot_table(index='utm_source', columns='event_type', values='user_id', aggfunc='nunique').fillna(0).to_dict('index')
    }
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 분석 완료! JSON 업데이트됨. 이제 3001번 화면을 새로고침하세요.")

if __name__ == "__main__":
    fast_run()
