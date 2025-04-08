# Cred-Hack

Cred-Hack is a full-stack application designed to streamline financial management. It features a modern frontend built with Next.js and Tailwind CSS, and a robust backend powered by FastAPI. The application includes tools for bank statement ingestion, categorization, and analysis, as well as AI-powered chat capabilities using OpenAI's API.

## Features

### Frontend
- **Modern UI**: Built with Next.js and styled using Tailwind CSS.
- **Bank Statement Upload**: Users can upload bank statements in `.xlsx` format for analysis.
- **Authentication**: User authentication and onboarding flows.
- **AI Chat**: Chat interface powered by OpenAI for financial advice.

### Backend
- **Bank Statement Processing**: Parses and categorizes transactions from uploaded bank statements.
- **Data Analysis**: Provides summaries of income, expenses, and monthly surpluses.
- **API Integration**: Exposes endpoints for frontend interaction.

## Project Structure

The repository is organized as follows:

```
cred-hack/
├── backend/                # Backend codebase
│   ├── app/                # FastAPI application
│   │   ├── main.py         # Entry point for the backend server
│   │   ├── services/       # Business logic and services
│   │   └── __init__.py     # Package initialization
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables for the backend
├── frontend/               # Frontend codebase
│   ├── src/                # Source code for the Next.js application
│   │   ├── app/            # Application pages and API routes
│   │   ├── components/     # Reusable UI components
│   │   └── styles/         # Global styles
│   ├── package.json        # Node.js dependencies
│   ├── .env.local          # Environment variables for the frontend
│   └── tailwind.config.js  # Tailwind CSS configuration
├── .gitignore              # Files and directories to ignore in Git
├── README.md               # Project documentation
└── LICENSE                 # License for the project
```

This structure separates the backend and frontend codebases, ensuring modularity and maintainability.

## Getting Started

### Prerequisites
- Node.js 18.x or later
- Python 3.11 or later
- Redis (for caching)
- An OpenAI API key

### Installation

#### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the `.env` file with the required environment variables:
   ```env
   JWT_SECRET_KEY=your_jwt_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Run the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env.local` file with the required environment variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Running the Application
1. Start the backend server by following the steps in the **Backend** section.
2. Start the frontend server by following the steps in the **Frontend** section.
3. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the application.


## Usage

1. Start the backend server by following the steps in the **Backend** section of the installation guide.
2. Start the frontend server by following the steps in the **Frontend** section of the installation guide.
3. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the application.
4. Upload a bank statement in `.xlsx` format for analysis.
5. Use the AI-powered chat interface to get financial advice or insights.

---

## Architecture

Cred-Hack is a full-stack application with the following architecture:

### Frontend
- **Framework**: Built with Next.js for server-side rendering and React-based UI.
- **Styling**: Tailwind CSS for modern and responsive design.
- **Features**:
  - Bank statement upload and analysis.
  - User authentication and onboarding flows.
  - AI-powered chat interface for financial advice using OpenAI's API.

### Backend
- **Framework**: FastAPI for building RESTful APIs.
- **Data Processing**: Utilizes Pandas for parsing and analyzing bank statements.
- **Caching**: Redis for caching frequently accessed data.
- **Features**:
  - Bank statement ingestion and categorization.
  - Income, expense, and surplus analysis.
  - API endpoints for frontend interaction.

### AI Integration
- **OpenAI API**: Used for generating financial advice and insights in the chat interface.

### Database
- **Storage**: SQLite or other relational databases for storing user data and transaction records.

---

This architecture ensures a seamless user experience with a modern frontend, a robust backend, and AI-powered features for financial management.