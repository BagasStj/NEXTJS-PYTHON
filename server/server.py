from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
from openai import OpenAI
import io
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Environment variables loaded:")
print(f"OPENAI_API_KEY: {'*' * len(os.getenv('OPENAI_API_KEY', ''))}")
print(f"ELEVENLABS_API_KEY: {'*' * len(os.getenv('ELEVENLABS_API_KEY', ''))}")

# Custom class to add a name attribute to BytesIO
class NamedBytesIO(io.BytesIO):
    def __init__(self, *args, name=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = name

# app instance
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# ElevenLabs API key
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

@app.route("/api/home", methods=['GET'])
def return_home():
    return jsonify({
        'message': "test"                                                                                           
    })

@app.route("/api/transcribe", methods=['POST'])
def speech_to_text():
    audio_file = request.files.get('file')
    if not audio_file:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_bytes = NamedBytesIO(audio_file.read(), name=audio_file.filename)

    try:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_bytes,
            language="id"
        )
        return jsonify({"text": response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/text-to-speech", methods=['POST'])
def text_to_speech():
    data = request.json
    text = data.get('text')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # ElevenLabs API endpoint
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"

        # Headers
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }

        # Data
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        # Make the request
        response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            # Return the audio data as a streaming response
            return Response(response.content, mimetype="audio/mpeg")
        else:
            return jsonify({'error': f"ElevenLabs API error: {response.status_code}"}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)