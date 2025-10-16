#!/bin/bash

# Database seeding script for Recovery Companion
# This script runs the SQL files in order to set up the database

echo "🌱 Starting database setup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set your Neon database connection string:"
  echo "export DATABASE_URL='your-neon-connection-string'"
  exit 1
fi

# Run table creation
echo "📋 Creating tables..."
psql "$DATABASE_URL" -f scripts/001_create_tables.sql

if [ $? -eq 0 ]; then
  echo "✅ Tables created successfully"
else
  echo "❌ Error creating tables"
  exit 1
fi

# Run data seeding
echo "🌱 Seeding initial data..."
psql "$DATABASE_URL" -f scripts/002_seed_initial_data.sql

if [ $? -eq 0 ]; then
  echo "✅ Data seeded successfully"
  echo ""
  echo "🎉 Database setup complete!"
  echo ""
  echo "Demo user created:"
  echo "  Email: demo@example.com"
  echo "  User ID: demo-user-123"
  echo ""
  echo "You can now sign in with the demo user to explore the app with sample data."
else
  echo "❌ Error seeding data"
  exit 1
fi
