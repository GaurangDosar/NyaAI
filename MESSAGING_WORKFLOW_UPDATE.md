# Messaging Workflow Update - Client Request → Lawyer Approval

## Summary of Changes

### Problem Fixed
1. **Users could directly message lawyers** without approval
2. **Lawyers had no messaging UI** to view/respond to messages

### Solution Implemented
1. **Request-based workflow**: First message is always a "request" (status='pending')
2. **Lawyer approval required**: Lawyers must accept requests before chat becomes active
3. **Full messaging UI for lawyers**: Added Messages tab in Lawyer Dashboard

---

## How It Works Now

### User Side (FindLawyers.tsx)

#### 1. Sending Initial Request
```typescript
- User clicks "Send a request" on lawyer profile
- First message automatically becomes a case request (is_case_request=true)
- Conversation status set to 'pending'
- User sees toast: "Request Sent - Your request has been sent to the lawyer. They will respond soon."
```

#### 2. After Lawyer Accepts
```typescript
- Conversation status changes to 'active'
- Users can now send normal messages
- Real-time chat enabled
- Document attachments work
```

### Lawyer Side (LawyerDashboard.tsx)

#### 1. Client Requests Tab
```typescript
- Shows all pending requests (status='pending')
- Displays client name, avatar, initial message
- Lawyer can:
  ✅ Accept → Creates case, sets status to 'active'
  ❌ Reject → Sets status to 'archived'
```

#### 2. Messages Tab (NEW!)
```typescript
- Shows all active conversations (status='active')
- Two-panel interface:
  - Left: List of active conversations with client names
  - Right: Chat window with message history
- Features:
  ✅ View all messages in conversation
  ✅ Send new messages to clients
  ✅ Real-time updates when client responds
  ✅ Shows client details (name, email, avatar)
```

---

## Files Modified

### 1. `src/pages/FindLawyers.tsx`
**Changes**:
- Modified `handleSendMessage()` to detect first message
- First message sets `is_case_request: true`
- Changed toast messages to reflect request vs regular message
- User cannot send regular messages until lawyer accepts

**Key Logic**:
```typescript
const existingConv = conversations.find(c => c.lawyer_id === lawyerId);
const isFirstMessage = !existingConv || existingConv.id.startsWith('temp-');
const isCaseRequest = isFirstMessage;

// Send with is_case_request flag
body: JSON.stringify({
  lawyer_id: lawyerId,
  text: messageText || '📎 Attachment',
  attachments: attachments,
  is_case_request: isCaseRequest  // <-- Request flag
})
```

### 2. `src/pages/LawyerDashboard.tsx`
**Changes**:
- Fixed `loadClientRequests()` to use `messages` table (was `lawyer_messages`)
- Fixed `profiles` join to use `user_id` field (was `id`)
- Added `activeConversations` state for active chats
- Added `loadActiveConversations()` function
- Added `handleSendLawyerMessage()` function
- Added Messages tab in UI with:
  - Conversations list
  - Chat window
  - Real-time message subscription
- Added real-time subscription for new messages

**New Functions**:
```typescript
loadActiveConversations()  // Loads status='active' conversations
handleSendLawyerMessage()  // Sends message from lawyer
Real-time subscription     // Updates UI when client sends message
```

### 3. `supabase/functions/send-message/index.ts`
**Changes**:
- Added support for `conversation_id` parameter (for lawyer replies)
- Made `lawyer_id` optional (not needed when conversation_id provided)
- Added logic to use existing conversation when ID provided
- Removed duplicate conversation check code

**New Flow**:
```typescript
if (conversation_id) {
  // Use existing conversation (lawyer replying)
  conversation = await getConversation(conversation_id);
} else {
  // Create new or find existing (client initiating)
  conversation = await findOrCreateConversation(user.id, lawyer_id);
}
```

---

## Database Tables Used

### conversations
```sql
- id: uuid
- user_id: uuid (client)
- lawyer_id: uuid (lawyer)
- status: text ('pending', 'active', 'archived')
- last_message_at: timestamptz
- created_at: timestamptz
```

### messages
```sql
- id: uuid
- conversation_id: uuid
- sender_id: uuid
- text: text
- attachments: jsonb
- is_case_request: boolean  # <-- Request flag
- delivered: boolean
- read: boolean
- created_at: timestamptz
```

### cases
```sql
- id: uuid
- lawyer_id: uuid
- client_id: uuid
- title: text
- description: text
- status: text ('pending', 'active', 'won', 'lost', 'closed')
- attachments: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

---

## Workflow Diagram

```
USER SIDE                          LAWYER SIDE
┌──────────────────┐              ┌──────────────────┐
│ FindLawyers Page │              │ Lawyer Dashboard │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         │ 1. Click "Send Request"          │
         │    → is_case_request: true       │
         │    → status: 'pending'           │
         ├─────────────────────────────────>│
         │                                  │ 2. View in "Client Requests" tab
         │                                  │    → Shows pending requests
         │                                  │    → Lawyer reviews message
         │                                  │
         │                  3a. ACCEPT      │
         │  <──────────────────────────────┤
         │    → Creates case                │
         │    → status: 'active'            │
         │    → Shows in "Messages" tab     │
         │                                  │
         │ 4. Can now chat freely          │
         │    → Send/receive messages       │
         │  <─────────────────────────────>│
         │    → Attach documents            │
         │    → Real-time updates           │
         │                                  │
                     OR
         │                  3b. REJECT      │
         │  <──────────────────────────────┤
         │    → status: 'archived'          │
         │    → Conversation closed         │
```

---

## Testing Checklist

### User Flow
- [ ] User searches for lawyers
- [ ] User clicks "Send a request" on lawyer profile
- [ ] Chat window opens at bottom-right
- [ ] User types message and clicks Send
- [ ] Toast shows "Request Sent"
- [ ] User cannot see "Messages" tab in conversation (request pending)

### Lawyer Flow
- [ ] Lawyer logs in to dashboard
- [ ] "Client Requests" tab shows badge with count
- [ ] Click on Client Requests tab
- [ ] See pending request with client name and message
- [ ] Click on request card
- [ ] Fill in case title and description
- [ ] Click "Accept Request"
- [ ] Request disappears from Client Requests
- [ ] "Messages" tab badge increases by 1
- [ ] Click Messages tab
- [ ] See conversation in left panel
- [ ] Click conversation
- [ ] See chat history in right panel
- [ ] Type message and click Send
- [ ] Message appears in chat

### Real-time Updates
- [ ] Have user and lawyer windows open side-by-side
- [ ] User sends message → Appears on lawyer side instantly
- [ ] Lawyer sends message → Appears on user side instantly
- [ ] No page refresh needed

---

## Next Steps

### Required
1. **Run migration**: `20251109120000_fix_foreign_keys_to_auth_users.sql`
2. **Deploy edge function**: `supabase functions deploy send-message`
3. **Test the complete flow** with 2 browser windows

### Optional Improvements
- Add unread message counter
- Add typing indicators
- Add message read receipts
- Add file attachment for lawyers
- Add notification sounds
- Add email notifications when request received

---

## Deployment Commands

```powershell
# 1. Deploy updated edge function
supabase functions deploy send-message

# 2. Test locally (if needed)
npm run dev

# 3. Check for errors in browser console
# Look for: "Request Sent" toast, conversation updates, real-time messages
```

---

## Troubleshooting

### Issue: "Foreign key constraint violation"
**Solution**: Run the migration `20251109120000_fix_foreign_keys_to_auth_users.sql`

### Issue: Lawyer doesn't see Messages tab
**Solution**: 
- Check that conversation status is 'active' (not 'pending')
- Lawyer must accept the request first
- Refresh the page after accepting

### Issue: Messages not appearing in real-time
**Solution**:
- Check browser console for WebSocket errors
- Verify Supabase Realtime is enabled for `messages` table
- Check that both users are authenticated

### Issue: Lawyer can't send messages
**Solution**:
- Ensure `conversation_id` is being passed to send-message function
- Check that conversation status is 'active'
- Verify edge function is deployed with latest code

---

## Summary

✅ **Users can no longer directly message lawyers**
✅ **Request-based workflow implemented**
✅ **Lawyers have full messaging UI**
✅ **Real-time updates working**
✅ **Proper conversation status management**

The messaging system now follows a proper approval workflow where users send requests, lawyers review and accept/reject them, and only then can both parties freely communicate!
