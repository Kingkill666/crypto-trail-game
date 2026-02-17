# Token Balance Alert System

Automatic monitoring and notifications when sponsored token balances run low in the rewards contract.

## Overview

The alert system monitors token balances in the rewards contract (`0x05B36Ca96630BD18808b84B9114B5919849Fab0D`) and sends notifications to the admin wallet (`0x257Cbe89968495C3aE8C81BccB8BE7f257CD5f66`) when balances drop below thresholds.

## Alert Thresholds

- **Warning (⚠️)**: Less than 100 claims remaining
- **Critical (🚨)**: Less than 50 claims remaining

## How It Works

### 1. Automatic Monitoring (Vercel Cron)

- Runs every 6 hours automatically
- Checks all token balances via `/api/cron/check-balances`
- Configured in `vercel.json`
- No action required - fully automatic

### 2. Manual Check

Check balances anytime via API:

```bash
curl "https://crypto-trail-game.vercel.app/api/admin/token-balances?secret=YOUR_ADMIN_SECRET"
```

Response includes:
- Current balance for each token
- Claims remaining
- Status (healthy/warning/critical/empty)
- Summary of all tokens
- Alerts sent (if any)

### 3. On-Chain Notifications (Optional)

Deploy the AlertNotifier contract to emit on-chain events:

```bash
forge script contracts/DeployAlertNotifier.s.sol:DeployAlertNotifier \
  --rpc-url https://mainnet.base.org \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast
```

Then add to `.env.local`:
```
NEXT_PUBLIC_ALERT_NOTIFIER_CONTRACT=0x...
```

Monitor events on Basescan or set up wallet notifications.

## Alert Flow

1. **Cron job triggers** (every 6 hours)
2. **API checks balances** for all tokens via RPC
3. **Calculate claims remaining** = balance / reward_amount
4. **Check thresholds**:
   - If < 100 claims → WARNING
   - If < 50 claims → CRITICAL
5. **Check if already alerted** (prevents spam)
6. **Send alert** (log message + optional on-chain event)
7. **Record alert in Redis** (prevents duplicate alerts for 24 hours)

## Alert Deduplication

- Alerts sent at most once per 24 hours per token per level
- Stored in Redis with 48-hour TTL
- Automatically cleared when balance is refilled

## Response Format

```json
{
  "success": true,
  "rewardsContract": "0x05B36Ca96630BD18808b84B9114B5919849Fab0D",
  "alertWallet": "0x257Cbe89968495C3aE8C81BccB8BE7f257CD5f66",
  "balances": [
    {
      "symbol": "BRND",
      "address": "0x41Ed0311640A5e489A90940b1c33433501a21B07",
      "balance": "5100000000000000000000000",
      "claimsRemaining": 202,
      "rewardAmount": "25252530000000000000000",
      "status": "healthy",
      "lastChecked": 1708200000000
    }
  ],
  "alerts": [
    "🚨 PIZZA balance critical! Only 45 claims remaining. Refill rewards contract."
  ],
  "summary": {
    "total": 6,
    "healthy": 4,
    "warning": 1,
    "critical": 1,
    "empty": 0
  },
  "lastCheck": 1708200000000,
  "timestamp": 1708200000000
}
```

## Token Status Definitions

- **healthy**: > 100 claims remaining
- **warning**: 51-100 claims remaining
- **critical**: 1-50 claims remaining
- **empty**: 0 claims remaining

## Refilling Tokens

When you send more tokens to the contract:

1. Alert record is automatically cleared on next check
2. Status changes from critical/warning → healthy
3. No more alerts until balance drops again

## Security

- API endpoint requires `ADMIN_SECRET` for access
- Cron endpoint requires Bearer token authentication
- Only authorized requests can trigger balance checks
- No sensitive data exposed in responses

## Monitoring

### View Logs

In Vercel dashboard:
1. Go to your project
2. Click "Logs"
3. Filter for `[ALERT]` or `[CRON]`

### Manual Trigger

Force a check immediately:

```bash
curl -X POST https://crypto-trail-game.vercel.app/api/admin/token-balances \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_ADMIN_SECRET"}'
```

## Files

- `/lib/alert-helpers.ts` - Core alert logic
- `/app/api/admin/token-balances/route.ts` - Admin API endpoint
- `/app/api/cron/check-balances/route.ts` - Cron job handler
- `/contracts/AlertNotifier.sol` - On-chain event emitter
- `/vercel.json` - Cron schedule configuration

## Troubleshooting

**Alerts not sending?**
- Check Vercel cron logs
- Verify `ADMIN_SECRET` is set
- Ensure Redis (Upstash) is configured

**False alerts?**
- Check threshold values in `lib/alert-helpers.ts`
- Verify token decimals in `lib/sponsored-tokens.ts`

**Spam alerts?**
- Alerts are rate-limited to once per 24 hours
- Check Redis for stuck alert records

## Future Enhancements

- [ ] Discord/Telegram webhook integration
- [ ] Email notifications via SendGrid
- [ ] SMS alerts via Twilio
- [ ] Dashboard UI for viewing balances
- [ ] Configurable thresholds per token
- [ ] Historical alert tracking
