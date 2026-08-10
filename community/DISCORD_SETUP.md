# Frasberg AI Discord Server Setup Guide

Complete guide for setting up and managing the Frasberg AI Discord community.

---

## Server Structure

### Categories & Channels

#### 📢 ANNOUNCEMENTS
*All channels read-only except for moderators*

- **#announcements** - Major releases, important news
- **#releases** - Version releases, changelogs
- **#blog-posts** - New blog posts and articles
- **#events** - Upcoming events, meetups, conferences

#### 💬 GENERAL

- **#welcome** - Server rules, intro channel for new members
- **#general** - General discussion about Frasberg AI
- **#showcase** - Share your projects built with Frasberg AI
- **#off-topic** - Non-Frasberg discussion, memes, casual chat

#### 🛠️ DEVELOPMENT

- **#contributors** - Contributor discussions, PR reviews
- **#help** - Get help using Frasberg AI
- **#bug-reports** - Report bugs (links to GitHub Issues)
- **#feature-requests** - Suggest new features
- **#code-review** - Request code reviews from community

#### 🔬 RESEARCH

- **#research-papers** - Academic research, paper discussions
- **#benchmarks** - Performance benchmarks, optimization
- **#algorithms** - Algorithm design and analysis
- **#experiments** - Experimental features and testing

#### 📚 DOCUMENTATION

- **#docs-discussion** - Documentation improvements
- **#tutorials** - Share tutorials and guides
- **#examples** - Code examples and snippets

#### 🏢 ENTERPRISE

- **#enterprise-users** - Private channel for enterprise customers
- **#deployment-help** - Help with production deployments
- **#integrations** - Integration discussions

#### 🎉 COMMUNITY

- **#events** - Community events
- **#jobs** - Job postings (Frasberg AI related)
- **#partnerships** - Partnership opportunities
- **#random** - Random chat

#### 🎙️ VOICE CHANNELS

- **General Voice** - Open voice chat
- **Office Hours** - Weekly office hours with maintainers
- **Pair Programming** - Collaborative coding sessions

---

## Roles & Permissions

### Role Hierarchy

#### 🔴 **Founder**
- @founder (you)
- Full administrative access
- All permissions

#### 🟠 **Core Team**
- Frasberg AI maintainers with commit access
- Permissions: Manage messages, manage roles, kick/ban
- Can post in #announcements

#### 🟡 **Contributors**
- Anyone with merged PR
- Special role color
- Access to #contributors channel
- Can post in #showcase

#### 🟢 **Researchers**
- Published research using Frasberg AI
- Access to #research-papers private discussions
- Can share preprints

#### 🔵 **Enterprise**
- Paying enterprise customers
- Access to #enterprise-users (private)
- Priority support

#### ⚪ **Community**
- Default role for all members
- Access to public channels

#### 🤖 **Bots**
- Bot role for automated services

### Role Assignment

**Automatic:**
- Everyone gets @Community on join
- @Contributors when PR merged (via GitHub integration)

**Manual:**
- @Core Team - Invite by founder
- @Researchers - Request via #research-papers
- @Enterprise - After purchase confirmation

---

## Server Bots

### 1. Frasberg Bot (Custom)
AI assistant powered by Frasberg AI itself!

**Features:**
- Answer questions about Frasberg AI
- Provide code examples
- Help with debugging
- Commands: `!frasberg ask [question]`

**Setup:**
```python
# Deploy bot using Frasberg AI API
# Code in: discord-bot/frasberg_bot.py
```

### 2. GitHub Bot
Links GitHub activity to Discord

**Features:**
- New PR notifications in #contributors
- New issue notifications in #bug-reports
- Release notifications in #releases

**Setup:**
1. Add GitHub webhook
2. Configure: Settings → Integrations → GitHub
3. Select channels for notifications

### 3. Welcome Bot (MEE6 or Dyno)
Welcomes new members

**Message Template:**
```
Welcome to Frasberg AI, @username! 👋

🎯 Get started:
• Read #welcome for server rules
• Introduce yourself in #general
• Check out #help if you have questions
• Browse #showcase for inspiration

📖 Resources:
• Docs: https://github.com/frasberg/frasberg-ai-backend
• GitHub: https://github.com/frasberg/frasberg-ai-backend
• Website: https://frasberg-ai.ai

Let's build the future of AI together! 🚀
```

### 4. Moderation Bot (Dyno)
Auto-moderation and logging

**Features:**
- Auto-delete spam
- Warn/timeout for violations
- Log deleted messages
- Custom commands

---

## Welcome Channel Content

### #welcome

```markdown
# Welcome to Frasberg AI! 👋

Frasberg AI is a planetary-scale distributed AI system. This is our community Discord server.

## 📋 Server Rules

1. **Be respectful** - Treat everyone with kindness
2. **Stay on topic** - Use appropriate channels
3. **No spam** - No excessive self-promotion or ads
4. **No harassment** - Zero tolerance for harassment
5. **Help others** - Be welcoming to newcomers
6. **Follow Discord ToS** - [Discord Terms](https://discord.com/terms)

## 🚀 Getting Started

**New to Frasberg AI?**
• Check out the [README](https://github.com/frasberg/frasberg-ai-backend)
• Ask questions in #help
• Share your projects in #showcase

**Want to contribute?**
• Read [CONTRIBUTING.md](https://github.com/frasberg/frasberg-ai-backend/blob/main/CONTRIBUTING-ENHANCED.md)
• Find [good first issues](https://github.com/frasberg/frasberg-ai-backend/labels/good-first-issue)
• Join discussions in #contributors

**Enterprise user?**
• Contact us for #enterprise-users access
• Email: enterprise@frasberg-ai.ai

## 🎯 Channel Guide

📢 **Announcements** - Important updates (read-only)
💬 **General** - General chat and questions  
🛠️ **Development** - Contributor discussions
🔬 **Research** - Academic research and papers
🏢 **Enterprise** - Enterprise support
🎉 **Community** - Events, jobs, partnerships

## 🔗 Links

• GitHub: https://github.com/frasberg/frasberg-ai-backend
• Documentation: [README](https://github.com/frasberg/frasberg-ai-backend)
• Twitter: [@frasberg_ai_ai](https://twitter.com/frasberg_ai_ai)
• Email: hello@frasberg-ai.ai

## 📞 Support

Need help? Ask in #help or email support@frasberg-ai.ai

---

**By participating, you agree to our [Code of Conduct](https://github.com/frasberg/frasberg-ai-backend/blob/main/CODE_OF_CONDUCT.md)**
```

---

## Server Settings

### General Settings
- **Server Name**: Frasberg AI
- **Server Region**: Automatic
- **Verification Level**: Medium (verified email)
- **Explicit Content Filter**: Scan media from all members
- **Default Notification**: Only @mentions

### Moderation
- **2FA Requirement**: For moderators
- **Invites**: Allow anyone to create invite links
- **Vanity URL**: discord.gg/frasberg-ai (if available)

### Integrations
- **GitHub**: Link repository
- **Twitter**: Auto-post tweets to #announcements
- **YouTube**: Auto-post videos (if creating video content)

---

## Community Events

### Weekly Events

#### **Office Hours** (Every Friday, 3pm UTC)
- Live Q&A with core team
- Voice channel + #general text chat
- 1 hour duration
- Record and post to YouTube

#### **Contributors Sync** (Every Monday, 5pm UTC)
- Contributor coordination
- Review PRs and issues
- Plan upcoming work
- #contributors channel

### Monthly Events

#### **Community Showcase** (First Saturday)
- Members demo projects
- Feedback session
- Vote on best project
- Winner featured in #announcements

#### **Research Paper Club** (Third Wednesday)
- Discuss recent AI papers
- Relate to Frasberg AI
- #research-papers channel

### Special Events

- **Hackathons** - Quarterly
- **Conferences** - When attending/speaking
- **Launch Parties** - Major version releases
- **AMAs** - With guest researchers/developers

---

## Moderation Guidelines

### Response Times
- Critical issues: Immediate
- Rule violations: Within 1 hour
- General questions: Within 24 hours

### Warning System
1. **First offense**: Verbal warning in DM
2. **Second offense**: 24-hour timeout
3. **Third offense**: 7-day ban
4. **Severe violations**: Immediate permanent ban

### What to Moderate
- Spam and self-promotion
- Harassment and hate speech
- NSFW content
- Doxxing and privacy violations
- Illegal activities
- Off-topic in wrong channels (gentle redirect)

### Escalation
- Tag @Core Team for serious issues
- DM founder for permanent bans
- Document all moderation actions

---

## Growth Strategy

### Launch Phase (Week 1-4)

**Week 1: Soft Launch**
- Invite core contributors (10-20 people)
- Test all channels and bots
- Gather feedback on structure

**Week 2: Beta Launch**
- Invite GitHub stargazers
- Post invite link in README
- Tweet invite link

**Week 3: Public Launch**
- Announce on Twitter, Reddit, HackerNews
- Publish blog post about Discord launch
- Invite link in all documentation

**Week 4: Community Building**
- First office hours
- First showcase event
- Reach 100 members

### Growth Tactics

1. **GitHub Integration**
   - Add Discord badge to README
   - Invite link in PR templates
   - Auto-invite on first PR

2. **Content Marketing**
   - Tweet interesting discussions
   - Screenshot cool projects
   - Highlight helpful community members

3. **Partner Servers**
   - Join related Discord servers
   - Cross-promote (with permission)
   - Participate in other communities

4. **Incentives**
   - Special roles for active members
   - Bounties for contributions
   - Feature projects in #showcase

### Target Milestones
- **Month 1**: 100 members
- **Month 3**: 500 members
- **Month 6**: 1,000 members
- **Year 1**: 5,000 members

---

## Discord Invite Links

### Creating Invite Link

1. Server Settings → Invites
2. Create invite link
3. Settings:
   - **Expire after**: Never
   - **Max uses**: Unlimited
   - **Temporary membership**: Off

### Custom Invite (if available)
Try to claim: `discord.gg/frasberg-ai`

### Invite Link Placement
- GitHub README
- Documentation
- Twitter bio
- Email signature
- Blog posts

---

## Analytics & Metrics

### Track Monthly
- Total members
- Active members (posted/reacted)
- Messages per channel
- New contributors from Discord
- Help requests resolved
- Showcase submissions

### Success Metrics
- **Engagement rate**: >20% active members
- **Response time**: <2 hours avg for #help
- **Contributor conversion**: 5% Discord → GitHub PR
- **Retention**: >80% members stay after 30 days

---

## Budget (if applicable)

### Discord Nitro Server Boost
**Cost**: $49.99/month (Level 2)

**Benefits:**
- Custom invite link (discord.gg/frasberg-ai)
- HD video/screen share
- Larger upload limit (50MB → 100MB)
- Custom server banner
- Vanity URL

**Worth it?**: If budget allows and 1000+ members

### Bot Hosting
- Free tier for most bots
- If custom Frasberg Bot: $5-20/month for hosting

---

## Setup Checklist

Before launching:

- [ ] Create server
- [ ] Set up all channels
- [ ] Configure roles and permissions
- [ ] Add bots (GitHub, Welcome, Moderation)
- [ ] Write welcome message
- [ ] Create invite link
- [ ] Test all channels with friends
- [ ] Add Frasberg AI team as moderators
- [ ] Pin important messages
- [ ] Create channel descriptions
- [ ] Set up server icon and banner
- [ ] Configure moderation settings
- [ ] Schedule first office hours
- [ ] Announce launch

---

## Questions?

Contact: discord@frasberg-ai.ai

---

*Last updated: February 2026*
