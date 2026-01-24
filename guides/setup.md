# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: The runtime environment.
- **npm**: The package manager (usually bundled with Node.js).

## Installation

1.  **Clone the repository**:

    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Install Playwright Browsers** (Required for running tests):
    ```bash
    npx playwright install
    ```

## Running the Application

### Development Server

To start the local development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port shown in your terminal).

### Building

To build the library package:

```bash
npm pack
```

To build the showcase/preview application:

```bash
npm run build
```
