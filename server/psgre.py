import psycopg2
import time
import requests
import json
import os

# Connection to database
connection = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    dbname=os.getenv('DB_NAME')
)

# Variable to store the last value of the monitored column
last_value = None

def check_for_update():
    global last_value
    with connection.cursor() as cursor:
        cursor.execute('SELECT no_antrian FROM public."SampleDataNomorAntrian" ORDER BY id DESC LIMIT 1')
        result = cursor.fetchone()

        # Cek apakah ada perubahan pada kolom yang dipantau
        if result and result[0] != last_value:
            last_value = result[0]
            send_message(last_value)

def send_message(value):
    url = 'https://api.fonnte.com/send'
    token = os.getenv('FONNTE_TOKEN')  # Get token from environment variable
    
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
    }
    
    payload = {
        'target': '081334319568',  # Replace with the destination number
        'message': f'Column updated with new value: {value}',
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()

# Main loop
if __name__ == "__main__":
    try:
        while True:
            check_for_update()
            time.sleep(5)  # Cek setiap 5 detik
    except KeyboardInterrupt:
        print("Program dihentikan oleh pengguna")
    finally:
        connection.close()