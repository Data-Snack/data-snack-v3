#!/bin/bash

# Data Snack v3 - Setup Script
echo "🚀 Setting up Data Snack v3..."

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup git hooks for conventional commits
echo "🔧 Setting up git hooks..."
pnpm dlx husky-init && pnpm install
pnpm dlx husky add .husky/commit-msg 'pnpm dlx commitlint --edit "$1"'

# Create .env.local file if it doesn't exist
if [ ! -f apps/web/.env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > apps/web/.env.local << EOF
# Database
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Tracking
NEXT_PUBLIC_GTM_ID=
GTM_SERVER_URL=http://localhost:8080
GA4_MEASUREMENT_ID=
GA4_API_SECRET=

# APIs
NEXT_PUBLIC_OPENWEATHER_API_KEY=
NEXT_PUBLIC_NEWS_API_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Development
NODE_ENV=development
EOF
fi

# Build packages
echo "🔨 Building packages..."
pnpm build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file in apps/web/"
echo "2. Set up Supabase project and add credentials"
echo "3. Configure GTM and analytics"
echo "4. Run 'pnpm dev' to start development"
echo ""
echo "Happy coding! 🎉"
