# Deployment Checklist

Use this checklist to deploy your apartment monitor to GitHub Actions.

## ✅ Pre-Deployment Checklist

### Local Testing

- [x] Dependencies installed (`npm install`)
- [x] Project builds successfully (`npm run build`)
- [x] Scraper test passes (`npm run test`)
- [x] Email notifications working (`npm run test:notifications`)
- [x] Gmail app password configured (no spaces!)
- [x] State file created

### Configuration Verified

- [x] `.env` file has correct values
- [x] `APARTMENT_URL` = `https://thetritonfostercity.com/lease-now`
- [x] `FLOOR_PLAN_NAME` = `Plan 1B` (or your preferred plan)
- [x] `SMTP_USER` and `SMTP_PASS` working
- [x] `EMAIL_TO` is correct recipient

## 📦 GitHub Actions Deployment

### Step 1: Create Repository

- [ ] Go to https://github.com/new
- [ ] Repository name: `triton-apartment-monitor` (or your choice)
- [ ] Choose **Public** (for unlimited free minutes)
  - OR **Private** if you'll run hourly (fits in 2,000 min/month)
- [ ] Don't initialize with README
- [ ] Create repository

### Step 2: Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Add each of these secrets:

#### Apartment Configuration
- [ ] `APARTMENT_URL` = `https://thetritonfostercity.com/lease-now`
- [ ] `FLOOR_PLAN_NAME` = `Plan 1B`
- [ ] `AVAILABILITY_TEXT` = `Available`

#### Email Configuration
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_SECURE` = `false`
- [ ] `SMTP_USER` = `your-email@gmail.com`
- [ ] `SMTP_PASS` = `your-gmail-app-password` (get from https://myaccount.google.com/apppasswords)
- [ ] `EMAIL_FROM` = `your-email@gmail.com`
- [ ] `EMAIL_TO` = `recipient@example.com`

#### SMS Configuration (Optional - any value works)
- [ ] `TWILIO_ACCOUNT_SID` = `ACxxxx` (or any placeholder)
- [ ] `TWILIO_AUTH_TOKEN` = `token` (or any placeholder)
- [ ] `TWILIO_PHONE_FROM` = `+1234567890` (or any placeholder)
- [ ] `TWILIO_PHONE_TO` = `+1234567890` (or any placeholder)

### Step 3: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Apartment availability monitor"

# Add GitHub repository as remote (REPLACE with your URL!)
git remote add origin https://github.com/YOUR_USERNAME/triton-apartment-monitor.git

# Push to GitHub
git branch -M main
git push -u origin main
```

- [ ] Git initialized
- [ ] Files committed
- [ ] Remote added
- [ ] Code pushed to GitHub

### Step 4: Enable Workflow Permissions

Go to: **Repository → Settings → Actions → General**

Scroll to "Workflow permissions":
- [ ] Select "Read and write permissions"
- [ ] Check "Allow GitHub Actions to create and approve pull requests"
- [ ] Click Save

### Step 5: Verify Actions Running

- [ ] Go to **Actions** tab
- [ ] See "Apartment Availability Monitor" workflow
- [ ] Workflow is enabled (green dot)
- [ ] First run started automatically

### Step 6: Check First Run

- [ ] Click on the running workflow
- [ ] Click "check-availability" job
- [ ] Expand steps to view logs
- [ ] Verify "Check completed successfully"
- [ ] Check `state.json` was committed

### Step 7: Verify Notifications

- [ ] Check email inbox (your configured email)
- [ ] Check spam folder if not in inbox
- [ ] Verify email received (if apartment was available)

## 🎯 Post-Deployment Verification

### Monitor Health

- [ ] Return to Actions tab after 30 minutes
- [ ] Verify second run completed
- [ ] Check for any error messages
- [ ] Confirm state.json is being updated

### Test Manual Trigger

- [ ] Go to Actions tab
- [ ] Click "Apartment Availability Monitor"
- [ ] Click "Run workflow" button
- [ ] Click green "Run workflow" button
- [ ] Verify manual run completes successfully

### Review Logs

- [ ] Click on any workflow run
- [ ] Verify scraper finds floor plans (26 plans)
- [ ] Verify "Plan 1B" is detected
- [ ] Check availability status is correct
- [ ] Confirm no error messages

## 🔧 Optional Optimizations

### Reduce GitHub Actions Usage (if needed)

If using private repo and exceeding 2,000 min/month:

**Option A: Make Repository Public**
- [ ] Go to Settings → Danger Zone
- [ ] Click "Change visibility"
- [ ] Select "Make public"
- [ ] Confirm (secrets remain private)

**Option B: Run Less Frequently**
- [ ] Edit `.github/workflows/monitor.yml`
- [ ] Change `cron: '*/30 * * * *'` to `cron: '0 */1 * * *'` (hourly)
- [ ] Commit and push changes

### Add SMS Notifications (Optional)

If you want to add Twilio SMS:

- [ ] Sign up at https://www.twilio.com/
- [ ] Get a phone number
- [ ] Copy Account SID and Auth Token
- [ ] Update GitHub Secrets with real Twilio values
- [ ] Workflow will automatically start sending SMS

### Monitor Multiple Floor Plans

To monitor additional plans:

- [ ] Duplicate `.github/workflows/monitor.yml`
- [ ] Rename to `monitor-plan2a.yml`
- [ ] Update `FLOOR_PLAN_NAME` secret reference
- [ ] Push changes

## 📊 Success Criteria

Your deployment is successful when:

- [x] Workflow runs every 30 minutes automatically ✅
- [x] Logs show successful scraping ✅
- [x] Floor plan is detected correctly ✅
- [x] Email notifications work ✅
- [x] State is persisted in `state.json` ✅
- [x] No error messages in logs ✅

## 🆘 Troubleshooting

### Workflow Not Running

**Issue:** No runs appear after 30 minutes

**Solutions:**
1. Check Actions is enabled (Settings → Actions)
2. Verify workflow file syntax
3. Look for errors in Actions tab
4. Try manual trigger

### Email Not Received

**Issue:** Check passes but no email

**Solutions:**
1. Check spam folder
2. Verify secrets are set correctly (no typos!)
3. Gmail password should have NO SPACES
4. Run locally to test: `npm run test:notifications`

### Permission Errors

**Issue:** "Permission denied" in logs

**Solution:**
1. Settings → Actions → General
2. Workflow permissions → "Read and write"
3. Save and re-run workflow

### State Not Updating

**Issue:** `state.json` not being committed

**Solution:**
1. Verify write permissions (see above)
2. Check git config is correct in workflow
3. Look for commit errors in logs

## 📞 Support Resources

- **GitHub Actions Logs**: Click on any run in Actions tab
- **Local Testing**: Run `npm run test` to debug
- **Email Test**: Run `npm run test:notifications`
- **Documentation**: See `README.md` and `GITHUB_ACTIONS_DEPLOYMENT.md`

## 🎉 You're Done!

Once all checkboxes are complete, your apartment monitor is:
- ✅ Running 24/7 for FREE
- ✅ Checking every 30 minutes
- ✅ Sending email notifications
- ✅ Automatically persisting state

**Congratulations!** You'll receive an email as soon as your apartment becomes available.

---

**Remember:** You can always view logs in the Actions tab to see what's happening!
