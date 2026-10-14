# nRp Kart – E-commerce Website Redesign

A responsive stationery e-commerce storefront built using React, Vite, Flask, and SQLite.

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
Open a separate terminal:
```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:
```powershell
.venv\Scripts\activate
```

Install the required Python dependencies and start the Flask application:
```bash
pip install -r requirements.txt
python app.py
```

Ensure the SQLite database is initialized and seeded according to the backend setup.

## Database and API

- **Database:** SQLite
- **Backend:** Python Flask
- **Frontend:** React with Vite
- **API:** REST endpoints for products and categories, with admin functionality.
- The frontend communicates with the backend through the API service in `frontend/src/services/api.js`.
- Configure backend environment variables locally in `backend/.env`. Never commit secrets or admin tokens.

## Design Decisions

- Bold, youthful storefront design inspired by nRp Kart.
- Responsive layout with a prominent hero banner and category cards.
- Product search, category filtering, sorting, price filtering, and availability filtering.
- Reusable React components and a chatbot interface to improve navigation and product discovery.
- Local image assets are stored in `frontend/public/images/`.

## Time Spent

Approximately **[enter your actual total hours] hours**, including setup, frontend development, backend/API integration, styling, debugging, and testing.

## Incomplete Features / Limitations

- Verify all category images and external image URLs before submission.
- Confirm admin authentication and all admin operations work correctly.
- Product checkout, payment integration, and order management are not confirmed as implemented.
- Further testing of API error handling, responsiveness, and database persistence may be required.

## Run Locally

Run the frontend and backend in separate terminals. Ensure the frontend API configuration points to the running Flask server.
