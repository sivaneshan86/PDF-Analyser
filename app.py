from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import os
from dotenv import load_dotenv
import google.generativeai as genai
from pypdf import PdfReader
from youtube_transcript_api import YouTubeTranscriptApi
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def get_gemini_model():
    return genai.GenerativeModel("gemini-2.0-flash-exp")

def extract_pdf_text(uploaded_file):
    try:
        reader = PdfReader(uploaded_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def get_youtube_video_id(url):
    query = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})')
    match = query.match(url)
    if match:
        return match.group(6)
    return None

def extract_youtube_transcript(video_id):
    try:
        api = YouTubeTranscriptApi()
        # First try to get English or Hindi directly
        try:
            transcript_list = api.fetch(video_id, languages=['en', 'hi'])
        except Exception:
            # If specific languages fail, try to list all and get the first available
            if hasattr(api, 'list'):
                transcript_ops = api.list(video_id)
                first_transcript = next(iter(transcript_ops))
                transcript_list = first_transcript.fetch()
            else:
                raise

        # transcript_list might contain dictionaries or FetchedTranscriptSnippet objects
        parts = []
        for item in transcript_list:
            if hasattr(item, 'text'):
                parts.append(item.text)
            else:
                parts.append(item['text'])
        
        transcript_text = " ".join(parts)
        return transcript_text
    except Exception as e:
        raise Exception(f"Error fetching transcript: {str(e)}")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        text = extract_pdf_text(file)
        return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    video_id = get_youtube_video_id(url)
    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    try:
        text = extract_youtube_transcript(video_id)
        return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    context = data.get('context')
    
    if not message or not context:
        return jsonify({'error': 'Missing message or context'}), 400

    if not api_key:
         return jsonify({'error': 'Server API Key not configured'}), 500

    try:
        model = get_gemini_model()
        full_prompt = f"""
        You are an expert analyst. Use the following context to answer the user's question. 
        If the answer is not in the context, say so, but try to be helpful.
        
        Context:
        {context[:30000]}  # Limit context to avoid token limits if extremely large, though Gemini 2.0 has large context
        
        User Question:
        {message}
        """
        
        # Stream response
        response = model.generate_content(full_prompt, stream=True)
        
        def generate():
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        return Response(stream_with_context(generate()), mimetype='text/plain')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
