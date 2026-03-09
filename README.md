### Online Simulator

A **web-based 3D Arduino and robotics simulator** built with TypeScript and Babylon.js.
The platform allows users to design circuits, place electronic components inside a 3D environment, write Arduino code directly in the browser, and simulate hardware behavior in real time.

This project aims to provide an interactive environment for learning and experimenting with **Arduino, robotics, and embedded systems** without requiring physical hardware.

---

### 🚀 Features

3D Simulation
Interactive **3D workspace** powered by Babylon.js
Place Arduino boards, sensors, motors, LEDs, and other components
Move, rotate, and arrange components in a realistic environment

### Integrated Code Editor:

**Monaco Editor** (the same editor used in VS Code)
Write and edit Arduino sketches directly in the browser
Syntax highlighting and modern editing experience

### Compile & Run Arduino Code:

Compile Arduino sketches through the backend
Execute them using **AVR8js** (ATmega328P emulator)
Real-time interaction between code and simulated hardware

### Visual Wiring System:
Draw wires between components
Build and visualize circuits easily
Export circuit designs as **PNG, JPG, or PDF**

### Component Library:

Built-in library of electronic components
Standard Kit
Components are loaded from a **database-backed parts library**

Project Saving:

### Save simulator projects including:
Components
Positions
Wiring connections
Reload saved configurations later

### Authentication System
User registration and login
Secure authentication using **JWT**
Password hashing with **bcrypt**


## 🛠 Tech Stack

| Layer          | Technologies                                        |
| -------------- | --------------------------------------------------- |
| Frontend       | TypeScript, Vite, Babylon.js, Monaco Editor, avr8js |
| Backend        | Node.js, Express.js                                 |
| Database       | MongoDB with Mongoose                               |
| Authentication | JWT, bcrypt                                         |


## 📁 Project Structure

```
online-simulator/
│
├── src/
│   ├── client/                # Frontend application
│   │   ├── pages/             # HTML entry points (simulator, login, dashboard)
│   │   ├── scripts/           # Application logic
│   │   │   ├── 3D rendering
│   │   │   ├── wiring system
│   │   │   └── Arduino execution
│   │   ├── css/
│   │   └── main.ts
│   │
│   └── server/                # Backend API
│       ├── config/            # Database connection
│       ├── controller/        # Auth, Arduino compile, parts
│       ├── models/            # MongoDB models
│       │   ├── User
│       │   └── Part
│       ├── routes/            # API routes
│       ├── server.js
│       └── seed.js            # Database seeding
│
├── public/                    # Static assets (3D models, images)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📋 Prerequisites
Before running the project, ensure you have installed:

* **Node.js** (v18 or newer recommended)
* **MongoDB** (Local installation or MongoDB Atlas)
* **npm** or **yarn**

Download Node.js:
https://nodejs.org

MongoDB documentation:
https://www.mongodb.com/docs/

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MaherLahlouh/3D-Part-Simulator.git
cd 3D-Part-Simulator
```

---

### 2. Install Frontend Dependencies

```bash
npm install
```

---

### 3. Install Backend Dependencies

```bash
cd src/server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside:

```
src/server/.env
```

Example configuration:

```
PORT=3001
DATABASE_URI=mongodb://localhost:27017/online-simulator
JWT_SECRET=your_secret_key
```

MongoDB connection guide:
https://www.mongodb.com/docs/manual/connection-string/

---

## 🧩 Seed the Components Database (Optional)

Populate the parts library with default components:

```bash
cd src/server
node seed.js
```

## ▶️ Running the Application

### Start Backend Server

```bash
cd src/server
npm start
```

Backend will run on:

```
http://localhost:3001
```


### Start Frontend Development Server

Open a new terminal and run:

```bash
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

If necessary, update the backend URL inside:

```
src/client/config.ts
```

## 📦 Available Scripts

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| npm run dev     | Start Vite development server                  |
| npm run build   | Compile TypeScript and build production bundle |
| npm run preview | Preview the production build                   |

Vite documentation:
https://vitejs.dev/guide/

## 🎯 Project Goals

This project was created to:

* Provide a **browser-based Arduino learning environment**
* Enable **hardware experimentation without physical devices**
* Demonstrate modern **3D web simulation techniques**
* Serve as a **full-stack educational platform**

---

## 📜 License

This project is provided for educational and development purposes.
Refer to the repository license file if available.

---

## 👨‍💻 Author

**Maher Lahlouh**

GitHub:
https://github.com/MaherLahlouh

LinkedIn:
https://www.linkedin.com/in/maher-lahlouh-210118275
