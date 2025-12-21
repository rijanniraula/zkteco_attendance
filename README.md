# ZKTeco Attendance Management System

A comprehensive attendance management system that integrates with ZKTeco biometric devices to monitor, track, and report employee attendance in real-time.

## Features

### 🔄 Real-Time Monitoring

- Live attendance tracking with instant feedback
- Automatic voice notifications for attendance status
- Real-time log monitoring from ZKTeco devices

### 📊 Device Management

- Device connection status monitoring
- User count and log capacity tracking
- Device information display

### 📋 Attendance Reports

- Date range filtering for attendance logs
- Comprehensive attendance reports with statistics
- Export functionality to Excel format

### 🎯 Smart Attendance Logic

- Staff and part-time employee categorization
- Late attendance detection and notifications
- Automated attendance validation

## Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose (currently commented out)
- **ZKTeco JS Library** for device communication
- **ExcelJS** for report generation
- **Text-to-Speech** integration for voice notifications

### Frontend

- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Table** for data display
- **Radix UI** components
- **Lucide React** icons

## Project Structure

```
zktec_logs/
├── attend_backend/          # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database and constants
│   │   ├── controllers/    # ZKTeco device controllers
│   │   ├── helpers/        # Utility functions and report generation
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Main server file
│   └── package.json
├── attend_frontend/         # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── helpers/       # API utilities
│   │   └── lib/           # Constants and utilities
│   └── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- ZKTeco biometric device connected to the network

### Backend Setup

1. Navigate to the backend directory:

```bash
cd attend_backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend root with your configuration:

```env
PORT=3000
MONGODB_URI =
NODE_ENV=development
ZK_IP
ZK_PORT
ZK_TIMEOUT=
ZK_INOUT=

```

4. Start the backend server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd attend_frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Device Management

- `GET /api/device-info` - Get ZKTeco device information
- `POST /api/attendance-logs` - Get filtered attendance logs
- `POST /api/export-logs` - Export attendance logs to Excel

### Real-Time Features

- Automatic real-time log monitoring on server startup
- Voice notifications for attendance status
- Late attendance detection

## Configuration

### Device Configuration

The system connects to ZKTeco devices using the `zkteco-js` library. Ensure your device is:

- Connected to the same network as the server
- Properly configured with IP address and port
- Accessible via the network

### Attendance Rules

- **Staff UIDs**: [7, 21, 24, 25] (defined in `constants.js`)
- **Part-time UIDs**: [2] (defined in `constants.js`)
- Late attendance triggers voice notification: "Sorry Attendance not recorded"
- On-time attendance triggers: "Thank You"

## Usage

1. **Device Connection**: The system automatically attempts to connect to the ZKTeco device on startup
2. **Real-Time Monitoring**: The backend continuously monitors attendance logs
3. **Web Interface**: Use the React frontend to:
   - View device status and information
   - Filter and view attendance logs by date range
   - Export attendance reports to Excel
   - Monitor real-time statistics

## Development

### Running Tests

```bash
# Backend tests (if implemented)
cd attend_backend
npm test

# Frontend linting
cd attend_frontend
npm run lint
```

### Building for Production

```bash
# Build frontend
cd attend_frontend
npm run build

# The built files will be in the 'dist' directory
```

## Support

For issues related to:

- ZKTeco device connectivity: Check device network configuration
- API endpoints: Review backend logs for error messages
- Frontend issues: Check browser console for errors
