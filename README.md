# 🎓 MentorBridge — Student Mentorship Platform

A full-stack web platform connecting college juniors and seniors for mentorship, placement guidance, Q&A, and resource sharing.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) (local) **or** MongoDB Atlas (cloud)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/MentorBridge   # Local MongoDB
# OR use Atlas: mongodb+srv://<user>:<pass>@cluster0.mongodb.net/MentorBridge
JWT_SECRET=your_secret_key_here
```

### 3. Run the Server
```bash
cd backend
node server.js
# OR with auto-reload:
npx nodemon server.js
```

### 4. Open the App
Go to **http://localhost:5000** in your browser.

---

## 📁 Project Structure

```
project2/
├── backend/           Express API server
│   ├── config/        MongoDB connection
│   ├── middleware/    JWT auth, file upload
│   ├── models/        Mongoose schemas
│   ├── routes/        API route handlers
│   ├── uploads/       Uploaded files (auto-created)
│   ├── .env           Environment config
│   └── server.js      Entry point
│
└── frontend/          Static HTML/CSS/JS
    ├── index.html           Landing page
    ├── login.html           Login / Register
    ├── dashboard-junior.html
    ├── dashboard-senior.html
    ├── dashboard-admin.html
    ├── senior-directory.html  Find Mentors
    ├── mentorship.html
    ├── messages.html
    ├── forum.html
    ├── question-detail.html
    ├── placement-hub.html
    ├── placement-detail.html
    ├── internship-hub.html
    ├── internship-detail.html
    ├── resources.html
    ├── subject-guidance.html
    ├── profile.html
    ├── edit-profile.html
    ├── css/            Design system CSS
    └── js/             Frontend JavaScript
```

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT-based login/register with role selection (Junior / Senior / Admin) |
| 👥 Senior Directory | Search mentors by branch, skills, domain, company |
| 🤝 Mentorship | Send, accept, reject mentorship requests |
| ✉️ Messaging | 1-to-1 chat with file sharing (polling-based) |
| 💬 Q&A Forum | Ask questions with anonymous mode, upvotes, accepted answers |
| 🏢 Placement Hub | Read real interview experiences from seniors |
| 💼 Internship Hub | Internship stories with resume tips and learnings |
| 📚 Resources | Upload and share PDFs, notes, links, videos |
| 📖 Subject Guidance | DBMS, OS, CN, OOPs, SE materials per subject |
| ⚙️ Admin Panel | Manage users, verify accounts, moderate content |

---

## 🔑 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/seniors` | Search seniors (with filters) |
| GET | `/api/users/me` | Get own profile |
| POST | `/api/mentorship/request` | Send mentorship request |
| GET | `/api/questions` | List forum questions |
| GET | `/api/experiences/placement` | List placement experiences |
| GET | `/api/resources` | List resources |
| GET | `/api/health` | Server health check |

---

## 🎨 Design System

- **Theme**: Dark mode with indigo-violet gradients
- **Font**: Inter (Google Fonts)
- **UI**: Glassmorphism cards, neon glow effects, micro-animations

---

## 📧 Default Admin Account

Create one by registering normally, then manually update the role in MongoDB:
```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```
