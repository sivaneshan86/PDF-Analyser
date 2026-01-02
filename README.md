# PDFChatter

PDFChatter is an intelligent web application that allows you to analyze and chat with the content of PDF documents and YouTube videos. Powered by Google's Gemini 2.0 AI, it provides summarization, Q&A, and deep insights into your media.

## Live Demo

[Live Link Here]

## Features

-   **PDF Analysis**: Upload PDF documents and ask questions about their content.
-   **YouTube Video Analysis**: Paste a YouTube video URL to analyze transcripts and video content.
-   **Gemini 2.0 Integration**: Leveages the latest advanced AI models from Google for accurate and context-aware responses.
-   **Interactive Chat**: User-friendly chat interface for seamless interaction.

## Tech Stack

-   **Backend**: Flask (Python)
-   **AI Model**: Google Gemini 2.0 (`google-generativeai`)
-   **PDF Processing**: `pypdf`
-   **YouTube Processing**: `youtube-transcript-api`
-   **Frontend**: HTML, CSS, JavaScript

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd PDFChatter
    ```

2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables**:
    Create a `.env` file in the root directory and add your Google API Key:
    ```env
    GOOGLE_API_KEY=your_google_api_key_here
    ```

## Usage

1.  **Run the application**:
    ```bash
    python app.py
    ```

2.  Open your browser and navigate to `http://localhost:5000` (or the port specified in the console).

3.  Start chatting with your PDFs or YouTube videos!

## License

MIT
