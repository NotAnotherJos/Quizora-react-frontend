# Quizora-react-frontend
A fully functional React.js single page application for real-time multiplayer quiz games, featuring admin dashboards, live sessions, and interactive player experiences.


<h1 align="center">🧠 Quizora: Real-Time Quiz Game Platform</h1>

---

## 🌍 Overview

**Quizora** is a React-based single-page quiz platform.  
It allows **admins** to create, edit, and manage quiz games, and **players** to join and play them in real-time via session codes — all without refreshing the page.

The platform demonstrates:
- Modular React component architecture
- Routing & state management for SPA behavior
- Real-time session updates
- Admin/player role-based flows
- Comprehensive Cypress & component tests

---

## 🧩 Core Features

### 🎮 1. Admin Authentication
- `/login` and `/register` routes with validation and error popups  
- Auto-redirect after successful login/logout  
- Global logout button across screens  

### 🧱 2. Game Management Dashboard
- Dashboard lists all created games with metadata (title, question count, duration, thumbnail)  
- Create, edit, and delete games dynamically (no refresh)  
- Navigate to game editing via `/game/{game_id}`  

### ✏️ 3. Game Editing
- Modify question text, duration, type (single/multiple/judgment), points, and media (YouTube/photo)  
- Add/delete questions dynamically  
- Upload thumbnail or edit metadata  

### 🚀 4. Session Control (Admin)
- Start or stop live sessions directly from dashboard  
- Copy session link for players to join  
- Real-time transition between questions  
- View session analytics after completion  

### 🧑‍🎓 5. Player Interaction
- Join via session code or shared URL  
- Wait in lobby until the session starts  
- Play interactive timed quizzes with auto-submission  
- View results after each question and final ranking  

### 📊 6. Results & Analytics
- Admin result screen: Top 5 leaderboard, accuracy charts, response-time graph  
- Player result screen: Personal performance breakdown  
- Bonus features: lobby animations, CSV/JSON upload, dynamic point system  

---

## 🧠 Architecture Overview

## 🧩 Frontend Directory Structure

```plaintext
frontend/
├── src/
│   ├── pages/                  # Each page = a route
│   │   ├── dashboard/
│   │   ├── game/
│   │   ├── login/
│   │   ├── register/
│   │   ├── PlayGame/
│   │   └── SessionResults/
│   ├── components/             # Reusable UI blocks
│   ├── utils/                  # API & helper functions
│   ├── test/                   # Vitest component tests
│   ├── App.jsx                 # Main entry with hash routing
│   └── main.jsx                # ReactDOM render root
│
├── cypress/                    # UI & component tests
├── e2e/                        # End-to-end tests
├── component/                  # Component-level tests (optional)
└── public/                     # Static assets
```

## ⚙️ Tech Stack

| Category | Tools / Libraries |
|-----------|-------------------|
| **Frontend** | React.js, JSX, Vite |
| **Routing** | Hash-based navigation |
| **Styling** | Vanilla CSS |
| **Testing** | Cypress, Vitest |
| **Linting** | ESLint |
| **Build Tool** | Vite |
| **Runtime** | Node.js v18+ |
| **Backend API** | Provided RESTful backend via `backend.config.json` |

---

## 🧪 Testing

### ✅ Component Testing
- Implemented with **Cypress component test runner**  
- Covers primitive UI components (`Counter`, `CardList`, etc.)  
- Each test validates props, actions, and rendering logic  

### ✅ UI Testing (Happy Path)
- Full flow for admin:
  1. Register → Login  
  2. Create game  
  3. Edit thumbnail and name  
  4. Add, switch, and delete slides/questions  
  5. Logout and re-login successfully  

### Example Test:
```js
cy.visit('/login');
cy.get('input[type=email]').type('admin@example.com');
cy.get('input[type=password]').type('password{enter}');
cy.url().should('include', '/dashboard');
```
🔧 Development Workflow
### 1. Set up:
    cd frontend
    ./util/setup.sh
    npm install

### 2. Run app:
    npm run dev

### 3. Run Linter:
    npm run lint

### 4. Run Tests:
    npm run test





    

    
