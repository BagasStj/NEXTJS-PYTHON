import logging
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
from openai import OpenAI
import io
import requests
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

logger.info("Environment variables loaded:")
logger.info(f"OPENAI_API_KEY: {'*' * len(os.getenv('OPENAI_API_KEY', ''))}")
logger.info(f"ELEVENLABS_API_KEY: {'*' * len(os.getenv('ELEVENLABS_API_KEY', ''))}")

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
    logger.info("Home endpoint accessed")
    return jsonify({
        'message': "test"                                                                                           
    })

@app.route("/api/transcribe", methods=['POST'])
def speech_to_text():
    logger.info("Transcribe endpoint accessed")
    audio_file = request.files.get('file')
    if not audio_file:
        logger.error("No audio file provided")
        return jsonify({'error': 'No audio file provided'}), 400

    audio_bytes = NamedBytesIO(audio_file.read(), name=audio_file.filename)

    try:
        logger.info(f"Transcribing audio file: {audio_file.filename}")
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_bytes,
            language="id"
        )
        logger.info("Transcription successful")
        return jsonify({"text": response.text})
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/text-to-speech", methods=['POST'])
def text_to_speech():
    logger.info("Text-to-speech endpoint accessed")
    data = request.json
    text = data.get('text')

    if not text:
        logger.error("No text provided for text-to-speech")
        return jsonify({'error': 'No text provided'}), 400

    try:
        logger.info("Sending request to ElevenLabs API")
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
            logger.info("Text-to-speech conversion successful")
            # Return the audio data as a streaming response
            return Response(response.content, mimetype="audio/mpeg")
        else:
            logger.error(f"ElevenLabs API error: {response.status_code}")
            return jsonify({'error': f"ElevenLabs API error: {response.status_code}"}), 500

    except Exception as e:
        logger.error(f"Error during text-to-speech conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    logger.info(f"Starting Flask app on port {os.environ.get('PORT', 8080)}")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)