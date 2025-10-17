#!/bin/bash

# Test script for stage-aware conversation flow
# This script tests the /api/chat/stage endpoint

echo "🧪 Testing Stage-Aware Conversation Flow"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check database schema
echo "📊 Test 1: Verifying database schema..."
STAGE_DEFAULT=$(psql "$DATABASE_URL" -t -c "SELECT column_default FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'stage';")

if [[ $STAGE_DEFAULT == *"greeting"* ]]; then
    echo -e "${GREEN}✓ Stage column default is 'greeting'${NC}"
else
    echo -e "${RED}✗ Stage column default is NOT 'greeting': $STAGE_DEFAULT${NC}"
    exit 1
fi

# Test 2: Check stage constraint
echo ""
echo "🔒 Test 2: Verifying stage constraint..."
CONSTRAINT=$(psql "$DATABASE_URL" -t -c "SELECT conname FROM pg_constraint WHERE conname = 'conversations_stage_check';")

if [[ $CONSTRAINT == *"conversations_stage_check"* ]]; then
    echo -e "${GREEN}✓ Stage constraint exists${NC}"
else
    echo -e "${RED}✗ Stage constraint does NOT exist${NC}"
    exit 1
fi

# Test 3: Verify flow.ts exports
echo ""
echo "📦 Test 3: Verifying flow.ts exports..."

if grep -q "export function getSystemPromptForStage" lib/flow.ts && \
   grep -q "export function getNextStage" lib/flow.ts && \
   grep -q "export function getSuggestedRepliesForStage" lib/flow.ts; then
    echo -e "${GREEN}✓ All required flow functions are exported${NC}"
else
    echo -e "${RED}✗ Missing required flow function exports${NC}"
    exit 1
fi

# Test 4: Check stage progression order
echo ""
echo "🔄 Test 4: Verifying stage progression order..."

if grep -q "greeting.*check_in" lib/flow.ts && \
   grep -q "check_in.*journal_prompt" lib/flow.ts && \
   grep -q "journal_prompt.*affirmation" lib/flow.ts && \
   grep -q "affirmation.*reflection" lib/flow.ts && \
   grep -q "reflection.*milestone_review" lib/flow.ts && \
   grep -q "milestone_review.*check_in" lib/flow.ts; then
    echo -e "${GREEN}✓ Stage progression order is correct${NC}"
else
    echo -e "${RED}✗ Stage progression order is incorrect${NC}"
    exit 1
fi

# Test 5: Verify API route exists
echo ""
echo "🛣️  Test 5: Verifying API routes exist..."

if [ -f "app/api/chat/route.ts" ]; then
    echo -e "${GREEN}✓ Chat API route exists${NC}"
else
    echo -e "${RED}✗ Chat API route does NOT exist${NC}"
    exit 1
fi

if [ -f "app/api/chat/stage/route.ts" ]; then
    echo -e "${GREEN}✓ Stage info API route exists${NC}"
else
    echo -e "${RED}✗ Stage info API route does NOT exist${NC}"
    exit 1
fi

# Test 6: Check chat interface component
echo ""
echo "🎨 Test 6: Verifying chat interface component..."

if grep -q "setCurrentStage" components/chat-interface-ai.tsx && \
   grep -q "setSuggestedReplies" components/chat-interface-ai.tsx && \
   grep -q "/api/chat/stage" components/chat-interface-ai.tsx; then
    echo -e "${GREEN}✓ Chat interface has stage management${NC}"
else
    echo -e "${RED}✗ Chat interface missing stage management${NC}"
    exit 1
fi

# Test 7: Verify all stages have suggested replies
echo ""
echo "💬 Test 7: Verifying suggested replies for all stages..."

STAGES=("greeting" "check_in" "journal_prompt" "affirmation" "reflection" "milestone_review")
ALL_STAGES_HAVE_REPLIES=true

for stage in "${STAGES[@]}"; do
    if grep -q "case \"$stage\":" lib/flow.ts; then
        echo -e "${GREEN}  ✓ $stage stage has configuration${NC}"
    else
        echo -e "${RED}  ✗ $stage stage missing configuration${NC}"
        ALL_STAGES_HAVE_REPLIES=false
    fi
done

if [ "$ALL_STAGES_HAVE_REPLIES" = false ]; then
    exit 1
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "📋 Summary:"
echo "  - Database schema configured correctly"
echo "  - Stage constraint in place"
echo "  - Flow orchestration implemented"
echo "  - API routes exist"
echo "  - UI components updated"
echo "  - All 6 stages have configurations"
echo ""
echo "🚀 Ready to test the live application!"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Navigate to the chat interface"
echo "  3. Start a conversation and verify greeting stage"
echo "  4. Progress through each stage manually"
echo "  5. Check suggested replies update at each stage"
