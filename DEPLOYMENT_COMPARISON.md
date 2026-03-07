# Deployment Options Comparison

Choose the best deployment method for your apartment monitoring needs.

## Quick Comparison Table

| Feature | GitHub Actions ⭐ | Heroku | AWS Lambda | Local (PM2) |
|---------|-------------------|---------|------------|-------------|
| **Cost** | **FREE** | ~$7/month | ~$5/month | FREE (electricity) |
| **Setup Time** | 10 minutes | 20 minutes | 30 minutes | 5 minutes |
| **Maintenance** | None | Low | Medium | Manual restarts |
| **Reliability** | High | Very High | Very High | Medium |
| **Logs** | GitHub UI | Dashboard | CloudWatch | Local files |
| **IP Blocking Risk** | Low-Medium | Low | Very Low | Very Low |
| **Credit Card Required** | No | Yes | Yes | No |

## Detailed Comparison

### 1. GitHub Actions (Recommended for Free) ⭐

**Best for:** Budget-conscious users who want zero-cost automated monitoring

**How it works:**
- Runs as scheduled GitHub workflow every 30 minutes
- Commits state changes to repository
- Uses GitHub's free CI/CD infrastructure

**Pros:**
- ✅ Completely FREE (2,000 minutes/month for private repos)
- ✅ Unlimited FREE for public repos
- ✅ No credit card required
- ✅ Easy to view logs in GitHub UI
- ✅ Automatic state persistence via git
- ✅ Manual trigger support
- ✅ Zero server management

**Cons:**
- ⚠️ GitHub IPs occasionally blocked (rare for apartment sites)
- ⚠️ Private repos limited to 2,000 min/month (use public for unlimited)
- ⚠️ Cron-based (can't run more frequently than every 5 minutes)
- ⚠️ Cold start every run (~30 seconds overhead)

**Setup Guide:** [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)

**Monthly Cost Breakdown:**
- Free tier: 2,000 minutes/month
- Runs every 30 min: 48 runs/day × 3 min/run = 144 min/day = 4,320 min/month
- **Solution:** Use public repo (unlimited) or run hourly (2,160 min/month - fits in free tier!)

---

### 2. Heroku

**Best for:** Users who want reliability and don't mind paying a small fee

**How it works:**
- Deploys as worker dyno
- Runs continuously with node-cron
- Managed PostgreSQL available for state (optional)

**Pros:**
- ✅ Very reliable uptime
- ✅ Easy deployment (git push)
- ✅ Excellent logging dashboard
- ✅ Automatic restarts
- ✅ Scale easily

**Cons:**
- ❌ Costs ~$7/month (Eco dyno)
- ❌ Requires credit card
- ❌ Needs Puppeteer buildpack
- ⚠️ Worker dyno sleeps after 30 min inactivity (use scheduler instead)

**Setup Guide:** See QUICKSTART.md Option B

**Monthly Cost:**
- Eco Dyno: $5/month (1,000 hours)
- OR Basic Dyno: $7/month (always on)

---

### 3. AWS Lambda + EventBridge

**Best for:** Advanced users wanting serverless architecture

**How it works:**
- Lambda function triggered by EventBridge every 30 minutes
- State stored in S3 or DynamoDB
- Runs only when triggered (pay per invocation)

**Pros:**
- ✅ Highly scalable
- ✅ Pay only for what you use
- ✅ Integrates with AWS ecosystem
- ✅ Very low cost at this scale

**Cons:**
- ❌ Requires AWS account and credit card
- ❌ More complex setup
- ❌ Puppeteer needs Chrome layer
- ⚠️ Steeper learning curve
- ⚠️ Cold starts (~5-10 seconds)

**Monthly Cost:**
- Lambda: ~$0.20/month (1M requests free tier)
- EventBridge: FREE
- S3 state storage: ~$0.01/month
- **Total: ~$0.21/month** (after free tier)

---

### 4. Local Computer with PM2

**Best for:** Users with a computer that's always on (Mac Mini, old laptop, Raspberry Pi)

**How it works:**
- PM2 keeps Node.js process running
- Restarts on crash
- Runs on your local machine

**Pros:**
- ✅ Completely FREE (just electricity)
- ✅ No IP blocking (uses your home IP)
- ✅ Instant setup (5 minutes)
- ✅ Full control
- ✅ No external dependencies

**Cons:**
- ❌ Requires computer to be always on
- ❌ Manual updates required
- ❌ Your responsibility to keep running
- ⚠️ Stops when computer restarts (unless configured)
- ⚠️ No remote access to logs

**Setup:**
```bash
npm install -g pm2
pm2 start npm --name "apartment-monitor" -- start
pm2 save
pm2 startup  # Follow instructions for auto-start on boot
```

**Monthly Cost:**
- Electricity: ~$1-2/month (laptop) or $5-10/month (desktop)

---

## Recommendation by Use Case

### "I want free and don't care if it's slightly less reliable"
→ **GitHub Actions** (public repo for unlimited minutes)

### "I want set-it-and-forget-it reliability"
→ **Heroku** ($7/month)

### "I'm AWS savvy and want the cheapest cloud option"
→ **AWS Lambda** (~$0.21/month)

### "I have a computer that's always on anyway"
→ **Local with PM2** (FREE)

### "I'm currently apartment hunting (temporary)"
→ **GitHub Actions** (free, easy to delete when done)

### "I need to monitor 10+ floor plans"
→ **Heroku** or **AWS Lambda** (better for parallel execution)

---

## Migration Guide

### From Local → GitHub Actions
1. Create GitHub repo
2. Add secrets
3. Push code
4. Stop PM2: `pm2 delete apartment-monitor`

### From GitHub Actions → Heroku
1. Set up Heroku app
2. Copy secrets from GitHub to Heroku config
3. Deploy
4. Disable GitHub Actions workflow

### From Anything → Local
1. Clone/pull latest code
2. Create `.env` file
3. Run `npm start` or use PM2

---

## Our Recommendation

**Start with GitHub Actions** (public repo):
1. Completely FREE forever
2. Works great for single apartment monitoring
3. Easy to set up (10 minutes)
4. Can always migrate to paid option later if needed

**Upgrade to Heroku if:**
- You need guaranteed reliability
- GitHub IPs get blocked
- You want better logging

**Use Local PM2 if:**
- You already have a server/computer running 24/7
- You're technically savvy
- You want zero external dependencies
