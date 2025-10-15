#!/bin/bash

echo "🏀 Starting Basketball App Development Server..."

cd backend

if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "📊 Running database migrations..."
npx prisma migrate deploy || npx prisma db push

echo "🌱 Seeding database..."
npm run seed

echo "🚀 Starting backend server..."
npm run dev
