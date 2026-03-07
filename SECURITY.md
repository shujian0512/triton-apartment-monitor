# 🔒 Security Guide

## ✅ Repository is Clean!

This repository was created with a fresh git history - no sensitive information has ever been committed.

All credentials are safely stored in GitHub Secrets and never in the codebase.

## Steps to Configure Your Repository

### Step 1: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Click **Create**
3. App name: `Apartment Monitor (New)`
4. Click **Generate**
5. Copy the 16-character password (no spaces!)

Example: `abcd efgh ijkl mnop` → copy as `abcdefghijklmnop`

### Step 2: Update GitHub Secret

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Add secret: `SMTP_PASS`
4. Paste your app password (no spaces!)
5. Click **Add secret**

### Step 3: Test Configuration

```bash
# Trigger a manual workflow run
# Go to Actions tab → Apartment Availability Monitor → Run workflow
```

Verify you receive an email notification.

### Step 4: Verify .env is Gitignored

```bash
# This should show .env
git check-ignore .env

# This should be empty (confirming .env was never committed)
git log --all --full-history -- .env
```

## Protected Files

### ✅ These files contain NO sensitive information:
- ✅ All `.env.example` files use placeholders
- ✅ All documentation uses example values
- ✅ No real credentials in codebase

## Safe to Commit (No Secrets)

### ✅ These files are safe to make public:
- All source code (`src/*.ts`)
- Configuration files (`.gitignore`, `tsconfig.json`, `package.json`)
- Documentation (`*.md` files - now cleaned)
- Workflows (`.github/workflows/*.yml`)
- `state.json` - No personal info, just floor plan statuses
- `dashboard.html` - No personal info, just data visualization
- `availability-history.jsonl` - No personal info, just availability records

### 🔒 These are protected by .gitignore:
- `.env` - Never committed
- `node_modules/` - Never committed
- Personal files

### 🔐 These are in GitHub Secrets (not in repo):
- `SMTP_PASS` - Email password
- `SMTP_USER` - Email address (can be public)
- `EMAIL_TO` - Recipient email
- `TWILIO_*` - SMS credentials (optional)

## After Making Repo Public

### What People Will See:
✅ Your source code (TypeScript/Node.js)
✅ How the apartment monitor works
✅ Documentation and setup guides
✅ Your git commit messages
✅ Your GitHub username/email (already public)

### What People WON'T See:
🔒 Your actual email password (in GitHub Secrets)
🔒 Your .env file (gitignored)
🔒 Twilio credentials (in GitHub Secrets)

### What People CAN See in Git History:
✅ Clean git history with no sensitive data
✅ Your GitHub username/email (standard for git commits)

## Ongoing Security Best Practices

### 1. Never Commit Secrets
```bash
# Always check before committing
git status

# If you see .env, DON'T commit!
git reset HEAD .env
```

### 2. Use GitHub Secrets
Store all sensitive data in:
- **Settings** → **Secrets and variables** → **Actions**

### 3. Rotate Credentials Periodically
- Generate new Gmail app password every 6 months
- Update GitHub Secret
- Revoke old password

### 4. Review Pull Requests Carefully
If accepting contributions:
- Check for accidentally committed secrets
- Review .gitignore changes
- Verify no .env or credentials

## Git History Security

### Check What's in History

```bash
# Search for potential secrets
git log --all -p | grep -i "password\|token\|secret\|key" | head -50

# Check specific file history
git log --all --full-history -- .env

# See all files ever committed
git log --all --name-only --pretty=format: | sort -u
```

### Clean Git History (Advanced - USE WITH CAUTION)

**⚠️ Only if absolutely necessary!**

To completely remove sensitive data from git history, you would need to use `git filter-branch` or BFG Repo-Cleaner. However:

1. This rewrites all commit SHAs
2. Anyone who cloned the repo needs to re-clone
3. It's complex and can break things
4. **Easier to just revoke the compromised credentials**

**Recommended:** Just revoke the old password. It's simpler and safer.

## Checklist Before Making Public

- [ ] Generated Gmail app password
- [ ] Added `SMTP_PASS` to GitHub Secrets
- [ ] Added all other required secrets to GitHub
- [ ] Tested workflow (received email notification)
- [ ] Verified .env is in .gitignore
- [ ] Verified .env was never committed (`git log --all --full-history -- .env` is empty)
- [ ] Read this security guide completely
- [ ] Ready to make repository public ✅

## Post-Public Monitoring

After making the repo public, monitor for:

1. **Unusual login attempts** to your Gmail
2. **Spam emails** if email harvested
3. **GitHub notifications** about your repo
4. **Forks/Stars** to see who's interested

## Questions?

### Q: Is it safe to make the repo public now?
**A:** Yes! The git history is clean - no sensitive data was ever committed.

### Q: What about credentials?
**A:** All credentials are stored in GitHub Secrets, never in the code.

### Q: What about my email addresses in commit messages?
**A:** Those are already public (GitHub shows commit author emails). This is normal and expected.

### Q: Should I use a different email for the monitor?
**A:** Optional. You could create a separate Gmail just for this monitor if you prefer.

## Summary

### ✅ Safe to make public:
1. ✅ Clean git history - no secrets ever committed
2. ✅ All credentials in GitHub Secrets
3. ✅ `.env` is gitignored
4. ✅ Documentation uses placeholder values

### 🎯 To Get Started (5 minutes):
1. Generate Gmail app password: https://myaccount.google.com/apppasswords
2. Add `SMTP_PASS` to GitHub Secrets
3. Add other required secrets
4. Test workflow
5. Make repo public ✅

## Ready to Make Public?

Once you've completed the checklist above, you can safely make the repository public!

**Settings** → **General** → Scroll to bottom → **Change repository visibility** → **Make public**
