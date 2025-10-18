#!/bin/bash

echo "🔍 BasketFlow Docker Debug Script"
echo "=================================="
echo ""

# Check if containers are running
echo "📦 Checking Docker containers..."
docker ps --filter "name=basket" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check backend logs
echo "📋 Backend logs (last 30 lines)..."
docker logs basket_app --tail 30
echo ""

# Test database connection
echo "🗄️  Testing database connection..."
docker exec basket_app sh -c 'node -e "
const { PrismaClient } = require(\"@prisma/client\");
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log(\"✅ Database connected. Users in DB:\", count);
  return prisma.user.findMany({ select: { username: true, role: true } });
}).then(users => {
  console.log(\"Users:\", JSON.stringify(users, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(\"❌ Database error:\", err.message);
  process.exit(1);
});
"'
echo ""

# Test API endpoint
echo "🌐 Testing API endpoint..."
TOKEN=$(docker exec basket_app sh -c 'curl -s -X POST http://localhost:3888/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin\"}" | grep -o "\"token\":\"[^\"]*\"" | cut -d"\"" -f4')

if [ -n "$TOKEN" ]; then
  echo "✅ Login successful, token: ${TOKEN:0:20}..."
  echo ""
  echo "📊 Fetching users from API..."
  docker exec basket_app sh -c "curl -s http://localhost:3888/api/admin/users -H 'Authorization: Bearer $TOKEN'" | head -20
  echo ""
else
  echo "❌ Login failed"
fi

echo ""
echo "✅ Debug complete!"
