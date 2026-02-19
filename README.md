# Tax-Calculator
/** inital package: 
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
# Tailwind
npm install -D tailwindcss@3.4.17 postcss autoprefixer
npx tailwindcss init -p
# React Hook Form + Zod
npm install react-hook-form zod @hookform/resolvers
npm run dev
# TailwindCSS needs to change two points: 
frontend/tailwind.config.js：content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
frontend/src/index.css（or src/main.css）add：
@tailwind base;
@tailwind components;
@tailwind utilities;
后端
mkdir backend
cd backend
npm init -y
# Express 
npm install express cors dotenv
# TS 
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
npx tsc --init
# PostgreSQL + Prisma（
npm install pg
npm install prisma @prisma/client
npx prisma init
docker run --name mypg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=myapp -p 5432:5432 -d postgres:16

**/
