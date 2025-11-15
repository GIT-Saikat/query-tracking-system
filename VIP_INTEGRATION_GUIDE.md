# VIP Detection with Channel Integrations

## How VIP Detection Works

The VIP detection system **already works** with all channel types! Here's how it adapts when you add channel integrations:

### Current System Design

The system uses **two fields** to identify VIP customers:
1. **`senderEmail`** - For email-based channels
2. **`senderId`** - For platform-specific user identifiers

The ML service checks **both fields** against your VIP lists when analyzing queries.

---

## How Each Channel Integration Will Work

### 1. Email Integration (IMAP/POP3)

**What gets populated:**
- `senderEmail`: `customer@example.com` ✅
- `senderId`: Usually `null` (unless you map emails to IDs)

**VIP Configuration:**
```env
VIP_EMAILS=customer@example.com,ceo@company.com,vip@client.com
VIP_SENDER_IDS=
```

**Example:**
- Email from `ceo@company.com` → Matches VIP_EMAILS → Gets HIGH priority automatically

---

### 2. Social Media APIs (Twitter, Facebook, Instagram)

**What gets populated:**
- `senderEmail`: Usually `null` (unless user provides email)
- `senderId`: Platform-specific user identifier

**Platform-specific sender IDs:**

#### Twitter:
- `senderId`: `@username` or `twitter_user_123456` (Twitter user ID)
- Example: `@elonmusk` or `44196397`

#### Facebook/Instagram:
- `senderId`: Facebook user ID or Instagram user ID
- Example: `fb_123456789` or `ig_987654321`

#### LinkedIn:
- `senderId`: LinkedIn profile ID
- Example: `li_abc123xyz`

**VIP Configuration:**
```env
VIP_EMAILS=  # Usually empty for social media
VIP_SENDER_IDS=@elonmusk,@verified_user,fb_123456789,ig_987654321
```

**Example:**
- Tweet from `@elonmusk` → Matches VIP_SENDER_IDS → Gets HIGH priority automatically

---

### 3. Chat Platforms (Discord, Slack)

**What gets populated:**
- `senderEmail`: Usually `null` (unless user provides email)
- `senderId`: Platform-specific user identifier

**Platform-specific sender IDs:**

#### Discord:
- `senderId`: Discord user ID (snowflake format)
- Example: `discord_123456789012345678` or `@username#1234`

#### Slack:
- `senderId`: Slack user ID
- Example: `slack_U01234ABCD` or `@username`

#### Microsoft Teams:
- `senderId`: Teams user ID
- Example: `teams_29:abc123xyz`

**VIP Configuration:**
```env
VIP_EMAILS=  # Usually empty for chat platforms
VIP_SENDER_IDS=discord_123456789012345678,slack_U01234ABCD,teams_29:abc123xyz
```

**Example:**
- Message from Discord user `discord_123456789012345678` → Matches VIP_SENDER_IDS → Gets HIGH priority automatically

---

## How to Configure VIP Lists for Multiple Channels

### Option 1: Single Combined List (Simple)

```env
# All VIP identifiers in one list
VIP_EMAILS=ceo@company.com,vip@client.com,enterprise@customer.com
VIP_SENDER_IDS=@twitter_vip,fb_123456789,slack_U01234ABCD,discord_987654321
```

**Pros:** Simple, easy to manage  
**Cons:** Hard to see which platform each ID belongs to

---

### Option 2: Platform-Specific Format (Recommended)

Use a consistent naming convention:

```env
VIP_EMAILS=ceo@company.com,vip@client.com

# Format: platform_identifier
VIP_SENDER_IDS=
  twitter_@username1,
  twitter_44196397,
  facebook_fb_123456789,
  instagram_ig_987654321,
  discord_discord_123456789012345678,
  slack_slack_U01234ABCD,
  teams_teams_29:abc123xyz
```

**Pros:** Clear which platform each ID belongs to  
**Cons:** Requires consistent naming in your integration code

---

### Option 3: Database-Driven VIP List (Advanced)

Instead of environment variables, store VIP customers in database:

```sql
-- New table: vip_customers
CREATE TABLE vip_customers (
  id UUID PRIMARY KEY,
  email TEXT,
  sender_id TEXT,
  platform TEXT,  -- 'EMAIL', 'TWITTER', 'FACEBOOK', etc.
  notes TEXT,
  created_at TIMESTAMP
);
```

Then modify ML service to check database instead of environment variables.

**Pros:** Dynamic, can be managed through admin UI  
**Cons:** Requires code changes

---

## Implementation Considerations

### 1. Normalize Sender IDs

Different platforms may use different formats. Consider normalizing:

```javascript
// In your channel integration code
function normalizeSenderId(platform, rawId) {
  const prefix = platform.toLowerCase();
  
  // Twitter: @username or numeric ID
  if (platform === 'TWITTER') {
    return rawId.startsWith('@') 
      ? `twitter_${rawId}` 
      : `twitter_${rawId}`;
  }
  
  // Facebook: numeric ID
  if (platform === 'FACEBOOK') {
    return `facebook_${rawId}`;
  }
  
  // Discord: numeric ID
  if (platform === 'DISCORD') {
    return `discord_${rawId}`;
  }
  
  // etc.
  return `${prefix}_${rawId}`;
}
```

### 2. Case Sensitivity

- **Emails**: Already case-insensitive (handled in `priority_scorer.py` line 55)
- **Sender IDs**: Currently case-sensitive - you may want to normalize to lowercase

**Recommendation:** Store all sender IDs in lowercase in VIP list:
```env
VIP_SENDER_IDS=twitter_@username,facebook_fb_123456789  # lowercase
```

### 3. Multiple Identifiers for Same Customer

A VIP customer might have:
- Email: `ceo@company.com`
- Twitter: `@ceo_company`
- LinkedIn: `li_abc123`

**Solution:** Add all identifiers to VIP lists:
```env
VIP_EMAILS=ceo@company.com
VIP_SENDER_IDS=twitter_@ceo_company,linkedin_li_abc123
```

### 4. Dynamic VIP Updates

If VIP lists change frequently, consider:
- Using a database table instead of environment variables
- Adding an API endpoint to update VIP lists without restarting ML service
- Caching VIP lists in memory and refreshing periodically

---

## Example: Complete Integration Flow

### Scenario: Twitter Integration

1. **Twitter webhook receives tweet:**
   ```json
   {
     "user": {
       "id": "44196397",
       "username": "@elonmusk",
       "email": null
     },
     "text": "Having issues with your service"
   }
   ```

2. **Your integration code creates query:**
   ```javascript
   const query = await createQuery({
     channelId: twitterChannelId,
     content: "Having issues with your service",
     senderName: "@elonmusk",
     senderEmail: null,  // Twitter doesn't provide email
     senderId: "twitter_44196397",  // Normalized format
     // ... other fields
   });
   ```

3. **Backend calls ML service:**
   ```javascript
   // In queryService.js
   mlAnalysis = await MLService.analyzeQuery({
     text: content,
     senderEmail: null,
     senderId: "twitter_44196397",  // Passed to ML service
     channelType: "TWITTER"
   });
   ```

4. **ML service checks VIP:**
   ```python
   # In priority_scorer.py
   is_vip = self.check_vip_status(
     sender_email=None,
     sender_id="twitter_44196397"
   )
   # Checks if "twitter_44196397" is in VIP_SENDER_IDS
   ```

5. **If VIP match found:**
   - Priority boosted by +0.3
   - Gets `vip` tag
   - Priority likely becomes HIGH or CRITICAL

---

## Testing VIP Detection

### Test Email VIP:
```bash
curl -X POST http://localhost:5000/api/queries \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "email_channel_id",
    "content": "Test query",
    "senderEmail": "ceo@company.com",
    "senderName": "CEO"
  }'
```

Expected: `is_vip: true`, `priority: HIGH`

### Test Social Media VIP:
```bash
curl -X POST http://localhost:5000/api/queries \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "twitter_channel_id",
    "content": "Test query",
    "senderId": "twitter_44196397",
    "senderName": "@username"
  }'
```

Expected: `is_vip: true`, `priority: HIGH`

---

## Summary

✅ **Good News:** The VIP system already works with all channel types!

✅ **What You Need to Do:**
1. When implementing channel integrations, populate `senderEmail` and/or `senderId` correctly
2. Add platform-specific identifiers to `VIP_SENDER_IDS` in the format your integration uses
3. Consider normalizing sender IDs for consistency (e.g., `platform_identifier`)

✅ **No Code Changes Needed:**
- The ML service already checks both `senderEmail` and `senderId`
- The priority scorer already handles VIP detection
- The auto-tagger already adds VIP tags

✅ **Optional Enhancements:**
- Database-driven VIP list (instead of environment variables)
- Case-insensitive sender ID matching
- VIP list management API
- VIP expiration dates

---

## Quick Reference: VIP Configuration by Channel

| Channel | Use `senderEmail`? | Use `senderId`? | Example VIP Config |
|---------|-------------------|-----------------|-------------------|
| **Email** | ✅ Yes | ❌ No | `VIP_EMAILS=customer@example.com` |
| **Twitter** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=twitter_@username` |
| **Facebook** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=facebook_fb_123456` |
| **Instagram** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=instagram_ig_987654` |
| **Discord** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=discord_123456789` |
| **Slack** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=slack_U01234ABCD` |
| **LinkedIn** | ❌ No | ✅ Yes | `VIP_SENDER_IDS=linkedin_li_abc123` |

---

**The VIP system is ready to work with all your channel integrations!** 🎯

