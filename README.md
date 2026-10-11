# SafeStay Student

**Find Better. Stay Safer.**

A student accommodation platform. Students search hostels, PGs and rooms by area, college or location; see official and anonymous community photos; read reviews; compare rents; request bookings; and ask an AI assistant. Admins moderate photos, reviews and reports and manage listings.

## Features

- Signup, login, JWT authentication, student and admin roles
- Search by area, city, college or name, with filters, sorting and distance
- Property pages with facilities, rooms, availability, ratings and reviews
- **Anonymous community photos**, moderated, with the uploader never exposed publicly
- Reviews (ratings come only from approved reviews; no fake ratings)
- Favorites, rent comparison (up to 4 properties), booking requests (no payments)
- AI recommendations and the "SafeStay AI" chatbot, grounded in database data
- Admin panel: dashboard, properties, rooms, buildings, bookings, photos, reviews, reports, users
- Optional AI photo observations (admin-triggered, neutral wording, never safety claims)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Axios |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |
| Images | Cloudinary |
| AI | External AI API, called only from the backend |
| Hosting | Vercel (frontend), Render (backend and database) |

## Project structure

```
safestay-student/
├─ backend/    Express API, Prisma schema, seed
└─ frontend/   Next.js app
```

## Run locally

Requirements: Node.js (LTS), Git, PostgreSQL (create an empty database named `safestay`).

```powershell
# Backend
cd backend
copy .env.example .env        # then edit .env with your real values
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                   # http://localhost:5000

# Frontend (second terminal)
cd frontend
copy .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Seeded demo logins (local development only):
`admin@safestay.demo` / `Admin@12345` and `student@safestay.demo` / `Student@12345`.

## Production

- Backend build command (Render): `npm install --include=dev && npm run build && npx prisma migrate deploy`
- Backend start command: `npm start`
- Create the production admin: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ chars) and run `npm run create-admin`
- Seed demo data without demo accounts: set `SEED_DEMO_USERS=false` and run `npx prisma db seed`
- Frontend (Vercel): root directory `frontend`, env var `NEXT_PUBLIC_API_URL`
- Set `FRONTEND_URL` on the backend to the exact Vercel address (no trailing slash)

## Privacy and safety design

- Public APIs never return uploader or reviewer identity.
- Uploaded photos are validated (type, size, file signature) and moderated before they appear.
- The site never claims a property is "safe" or "unsafe". Community content is labelled as shared by students, and users are told to verify in person.
- All demo data is fictional and marked as demo data.

## Known limitations

- Forgot-password has a page and an API endpoint, but no emails are sent (no email service is configured).
- No online payments (booking requests only).
- Profile editing and user management are not implemented.
- AI photo observations are admin-triggered, use cautious wording, and can be wrong; they are shown with a "verify personally" notice.
- Distances are straight-line estimates.
