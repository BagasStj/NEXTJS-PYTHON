# Next.js and Flask Full Stack Application

This project is a full-stack application that combines a Next.js frontend with a Flask backend API.

## Project Structure

- `client/`: Next.js frontend application
- `server/`: Flask backend API

## Frontend (Next.js)

The frontend is built with Next.js and React, providing a responsive and interactive user interface.

### Key Features
- Fetches data from the Flask API
- Displays messages from the backend
- Utilizes React hooks for state management and side effects

### Setup and Running
1. Navigate to the `client` directory
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Access the application at `http://localhost:3000`

## Backend (Flask)

The backend is a Python Flask application that serves as an API for the frontend.

### Key Features
- Provides a `/api/home` endpoint that returns a JSON response
- Configured with CORS to allow requests from the frontend

### Setup and Running
1. Navigate to the `server` directory
2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Run the Flask server: `python server.py`
5. The API will be available at `http://localhost:8080`

## Deployment

- The Next.js frontend is deployed on Vercel
- The Flask backend is deployed on a separate platform (URL: https://your-python-api-url.vercel.app)

## Development

- Ensure both frontend and backend servers are running for local development
- Update the API URL in `client/src/app/home/page.tsx` if the backend URL changes

## Notes

- The `.gitignore` file is set up to exclude common unnecessary files for both Next.js and Python projects
- Environment variables should be properly set up in production for any sensitive information