# InboxCleaner

**InboxCleaner** is a Node.js/TypeScript backend application designed to help you manage and clean your Gmail inbox . It uses the Gmail API to search for specific emails, back them up to your local machine, and delete them.

 currently built for personal use cases (like cleaning out rejection emails or newsletters), it is designed to be extensible for various email management tasks.


## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Language**: TypeScript
-   **Framework**: Express.js
-   **Integrations**: Google Gmail API (`googleapis`)
-   **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following:

-   [Docker](https://www.docker.com/) & Docker Compose (Recommended)
-   [Node.js](https://nodejs.org/) (v20+) (If running locally)
-   A **Google Cloud Project** with the Gmail API enabled.

## ⚙️ Setup & Configuration

### 1. Google Cloud Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project and enable the **Gmail API**.
3.  Navigate to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
4.  Select **Web application**.
5.  Set **Authorized redirect URIs** to: `http://localhost:3005/auth/google/callback`.
6.  Copy your **Client ID** and **Client Secret**.

### 2. Environment Variables
Copy the example environment file:
```bash
cp .env_exemple .env
```
Update `.env` with your credentials:
```ini
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3005/auth/google/callback
PORT=3005
```

### 3. Generate Refresh Token
1.  Start the application (see below).
2.  Visit `http://localhost:3005/auth/url` in your browser.
3.  Authorize the app and copy the `GMAIL_REFRESH_TOKEN` from the success page.
4.  Add the token to your `.env` file and restart the application.

## 🏃‍♂️ Running the Application

### Using Docker (Recommended)

**Production Mode:**
```bash
docker-compose up --build
```

**Development Mode (Hot Reloading):**
```bash
docker-compose -f docker-compose.dev.yml up --build
```
*Backups will be saved to the `./backups` directory on your host machine.*

### Running Locally

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run in development mode:
    ```bash
    npm run dev
    ```
3.  Build and start for production:
    ```bash
    npm run build
    npm start
    ```

## 🤝 Contributing

Contributions are welcome! Whether it's fixing a bug, improving documentation, code review or adding a new feature, I'd love to have your help.

1.  **Fork** the repository.
2.  Create a new **Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

Please ensure your code follows the existing style and includes relevant tests (if applicable).
