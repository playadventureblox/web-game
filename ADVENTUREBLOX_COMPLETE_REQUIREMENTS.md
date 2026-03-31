# AdventureBlox Platform - Complete Requirements Document

## Project Overview

AdventureBlox is  web-based gaming platform inspired by Roblox, designed to provide a safe, social, and engaging environment for players and game developers. This phase focuses on the platform infrastructure, social features, and economy system without 3D implementation.

---

## Technology Stack

- **Frontend:** React + Next.js
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with Prisma ORM
- **Real-time Communication:** Socket.IO
- **Authentication:** JWT-based
- **Image Storage:** Cloud storage (S3 or equivalent)
- **Password Hashing:** Argon2 or bcrypt

---

## 1. User Accounts & Authentication

### 1.1 User Roles

- **Player Client:** Can play games on the platform
- **Studio Client:** Can develop and publish games
- Users may hold both roles simultaneously

### 1.2 Account Creation & Registration

- Unique username requirement (no conflicts with existing names)
- Separate display names (can be duplicated across users)
- Reserved/blocked username list (profanity, brand names, staff names, impersonation)
- Email verification required before account activation
- Optional phone verification
- Password requirements and validation
- CAPTCHA verification for high-risk signups
- Age verification for age-appropriate content filtering

### 1.3 Authentication & Security

- JWT-based authentication system
- Secure password storage using Argon2 or bcrypt
- Password reset via secure time-limited token links
- Multi-factor authentication (optional)
- Session management
- Rate-limiting on login attempts to prevent brute force attacks
- IP-based throttling and block lists
- Device fingerprinting for security

### 1.4 Account Management

- Change username (with restrictions/cooldown)
- Change display name
- Email update with verification
- Password change
- Account deletion option
- Login history tracking (timestamp, IP, device fingerprint)
- Account creation date and last login date storage

### 1.5 Account Switching

- Users can link up to 10 accounts
- Easy switch between accounts without re-login
- Switch account option in More menu
- Session persistence for switched accounts

### 1.6 Ban & Termination System

- When account is terminated, system records:
  - Device fingerprint
  - IP ranges
  - Browser signature/user agent
- Block new account creation from banned fingerprints/IPs
- Automatic rejection or manual review flag for suspicious signups
- Account appeal process:
  - User can submit appeal form after ban
  - Staff dashboard to review appeals
  - Ability to restore accounts after review
- Ban reasons must be recorded and stored
- Temporary suspension options
- Permanent ban with detailed logging

---

## 2. Profile System

### 2.1 Profile Information

- Username (unique)
- Display name (non-unique)
- Profile picture/avatar
- About section (bio)
- Join date
- Last online/last seen timestamp
- Profile status (short text, profanity-filtered)
- Profile badges display
- Visit count to profile
- Currently playing game indicator

### 2.2 Profile Badges

**Platform Badges:**
- Early Adopter
- Premium Member
- Group Owner
- Verified Creator
- Staff badges (Moderator, Admin)

**Game Badges:**
- Earned from in-game achievements
- Stored centrally
- Displayed on profile
- Sorted by recently earned

### 2.3 Profile Customization

- Editable display name
- Editable profile status (with length limit and profanity filter)
- Profile theme options (Premium feature)
- Avatar customization
- Pet display on profile

### 2.4 Profile Privacy Settings

- Who can send friend requests (Everyone, Friends of Friends, No One)
- Who can send messages (Everyone, Friends, No One)
- Profile visibility (Public, Friends Only, Private)
- Online status visibility
- Last seen visibility

---

## 3. Presence & Status System

### 3.1 Real-time Presence

- **Online:** User is active on the platform
- **Offline:** User is not connected
- **In-Game:** User is currently playing a game (show game name)
- **Idle/AFK:** User is inactive for a period
- **Last Seen:** Timestamp of last activity

### 3.2 Status Updates

- Short text status (length limit enforced)
- Profanity filtering on statuses
- Visible on profile and friend list hover tooltips
- Status history (optional)

### 3.3 Real-time Updates

- Socket.IO for real-time presence updates
- Friend list shows real-time status changes
- Notifications when best friends come online
- "Currently playing" game display

---

## 4. Friends & Social System

### 4.1 Friends System

- **Unlimited friends** (no cap on friend count)
- Send friend request
- Accept/decline friend request
- Remove friend
- Block user
- Friend request notifications
- Anti-spam limits: maximum friend requests per minute/hour
- Ability to block friend requests from unknown users

### 4.2 Best Friends System

- Designate friends as "Best Friends"
- Maximum best friend limit (e.g., 10 users)
- Best friends appear at top of friend lists
- Best friend request notifications
- Dedicated "Best Friends Page" showing:
  - Online status
  - Currently playing game
  - Recent activity
  - Quick join to their game

### 4.3 Friend List Features

- Search friends by name
- Filter by online/offline/in-game
- Sort by alphabetical, recently online, best friends
- Quick actions: message, join game, view profile
- Friend count display

---

## 5. Notifications System

### 5.1 Notification Types

- Friend requests
- Best friend requests
- Friend accepted your request
- Group invitations
- Group role changes
- Group shouts
- Group wall mentions
- New messages
- Purchases completed
- Badges earned
- Game updates from followed creators
- Platform announcements
- Moderation actions (warnings, suspensions)

### 5.2 Notification Features

- Read/unread state
- "Mark all as read" option
- Notification icon with unread count badge
- Click notification to navigate to relevant page
- Notification history/archive
- Delivery channels:
  - In-site notifications (always)
  - Optional email notifications (parent-configurable for kids)
- Notification preferences in settings

---

## 6. Messaging & Chat System

### 6.1 Direct Messages

- One-on-one private messaging
- Message history
- Real-time delivery via Socket.IO
- Read receipts
- Typing indicators
- Message to non-friends (if enabled in settings)
- Email-style message system for platform updates

### 6.2 Group Chat

- Create group chats
- Maximum 10 people per group chat
- Group chat name
- Add/remove members
- Leave group chat
- Group chat notifications

### 6.3 In-Game Chat

- Real-time chat during gameplay
- Game-specific chat rooms
- Server/instance-based chat

### 6.4 Out-of-Game Chat

- Platform-wide chat capability
- Chat with friends while browsing

### 6.5 Chat Safety Features

- Word filter by age group
- Strict filter for younger users (aggressive blocking)
- Block sending URLs
- Block personal info patterns (email, phone, social media handles)
- Rate limiting for messages (anti-spam)
- Mute user
- Block user
- Report message
- Chat history moderation
- Parent-restricted modes:
  - Friends Only
  - Disabled completely

### 6.6 Live Support Chat

- Website chat for user support
- Live chat support feature
- Support ticket system
- Support page with FAQs

---

## 7. Group System

### 7.1 Group Creation & Management

- Create groups for free
- Group name (unique, moderation required)
- Group description (profanity-filtered)
- Group icon/logo
- Group cover photo (size and aspect-ratio constraints)
- Rename group feature
- Group owner designation
- Transfer group ownership
- Delete group

### 7.2 Group Roles & Permissions

- Create custom roles
- Role name
- Rank number (like Roblox rank levels)
- Reorder role ranks
- Role permissions:
  - Manage members (invite, kick, ban)
  - Manage roles
  - Post on wall
  - Delete wall posts
  - Post group shout
  - Manage group store
  - Manage group ads
  - Manage group games
  - View audit logs
  - Manage alliances
- Assign roles to members
- Default member role

### 7.3 Group Membership

- Join group (based on join settings)
- Leave group
- Group join settings:
  - Open join (anyone can join)
  - Request to join (requires approval)
  - Invite-only
- Member list with search
- Member count display
- Kick member
- Ban member from group
- Invite user to group

### 7.4 Group Wall

- Members can post on group wall (if role allows)
- Wall post content (text, length limit)
- Wall post timestamp
- Like/react to wall posts
- Comment on wall posts (optional)
- Pagination for wall posts
- Rate limits for posting (anti-spam)
- Officers can delete posts
- Officers can ban users from wall posting
- Moderation of wall content

### 7.5 Group Shout

- Post group shout (certain roles only, e.g., owner + high roles)
- Shout content (text + optional image)
- Image upload for shout
- Shout appears on:
  - Group page
  - Members' home feeds
  - Member notifications
- Only one active shout at a time
- Shout history stored for moderation
- Clear/remove shout

### 7.6 Group Cover Photo

- Upload cover photo
- Image size and format requirements
- Moderation/auto-scan of images
- Update cover photo
- Remove cover photo

### 7.7 Group Store

- Sell items on catalog through group store
- Group store tab on group page
- Items categorized (clothing, pets, accessories)
- Set item prices in AdventureBux
- Revenue goes to group owner/funds
- No publishing fees
- Item management (add, remove, update)

### 7.8 Group Alliances

- Send alliance request to other groups
- Accept/decline alliance requests
- Alliance list with links and icons
- Alliance benefits (cross-promotion)
- Remove alliance
- Alliance tab on group page

### 7.9 Group Games

- Publish games to groups
- Group games tab
- Games represent the group
- Group members can collaborate on games

### 7.10 Group Discovery

- Search groups by name
- Browse groups by category
- Sort by:
  - Most members
  - Recently created
  - Most active
- Featured groups

---

## 8. User Ads System (Old Roblox-Style)

### 8.1 Ad Creation

- Upload image as ad
- Required image resolution templates:
  - Standard banner (728x90)
  - Skyscraper (160x600)
  - Square tile (250x250)
- Image format requirements (PNG, JPG)
- Image file size limits
- Ad name/title
- Ad link target:
  - User profile
  - Group page
  - Game page
  - Catalog item page

### 8.2 Ad Bidding System

- Bid using AdventureBux
- Minimum bid per day or per campaign
- Set campaign duration
- Set total budget
- Ads compete for impressions based on:
  - Bid amount
  - Performance score (CTR)
- Ad rotation algorithm: `weight = bid × performance_score`
- Higher bids = more impressions

### 8.3 Ad Analytics

- Track impressions (views)
- Track clicks
- Calculate CTR (Click-Through Rate)
- Display AdventureBux spent
- Daily/weekly/monthly reports
- Performance graphs
- ROI metrics

### 8.4 Ad Moderation

- Ads queue for moderation before going live
- Manual review by staff
- Auto-scan for inappropriate content
- Ads can be reported by users
- Auto-disable ads with multiple reports
- Ads violating policies are removed
- Refund system for rejected ads

### 8.5 Ad Display

- Ads shown on:
  - Home page
  - Games page
  - Catalog page
  - Group pages
  - Profile pages (optional)
- Ad placement slots
- Random rotation weighted by bid
- Frequency capping (don't show same ad too often to same user)

### 8.6 Ad Settings (User/Group Choice)

- Toggle between old ads system or lighter version
- Group can choose ad system preference
- User can opt-out of seeing certain ad types (Premium feature)

---

## 9. Economy & Monetization

### 9.1 AdventureBux (Platform Currency)

**Earning AdventureBux:**
- Purchase with real money (future integration)
- Premium membership monthly stipend
- Promo rewards and events
- Developer payouts from game revenue (future)
- Daily login bonuses
- Completing achievements

**Spending AdventureBux:**
- Avatar shop items
- Pet shop items
- Catalog purchases
- Ads bidding
- Group store items
- Game passes (future)
- Developer products (future)
- Premium membership purchase

**Transaction System:**
- Every AdventureBux change must be logged:
  - Transaction ID
  - Amount (positive or negative)
  - Timestamp
  - Source (purchase, ad bid, store purchase, reward, transfer)
  - Description
  - User balance before/after
- Transaction history page for users
- Audit trail for moderation

**Currency Limits:**
- Maximum balance cap (optional)
- Maximum transaction amount
- Daily spending thresholds (important for parental control)
- Maximum bids per ad campaign

### 9.2 Premium Membership

**Premium Features:**
- Monthly AdventureBux stipend
- Premium badge on profile
- Premium-only avatar items
- Premium-only pet items
- Exclusive profile themes
- Ability to boost groups or games
- Ad-free experience (or reduced ads)
- Priority customer support
- Early access to new features
- Increased friend list priority display
- Premium-only filters in games ("Premium Recommended")

**Premium Management:**
- Monthly subscription model
- Premium status with start and end dates
- Automatic renewal (when payment integrated)
- Cancel subscription option
- Premium history tracking
- Premium gifting (optional)

**Premium Pricing:**
- Monthly subscription fee (to be determined)
- Annual subscription with discount (optional)

### 9.3 Marketplace

**Avatar Shop:**
- Browse avatar items (clothing, accessories, faces)
- Search by name or keyword
- Filter by:
  - Item type (hat, hair, shirt, pants, face, accessory)
  - Price range
  - Premium-only
  - Limited items (future)
  - Recently added
  - Most popular
- Sort by:
  - Price (low to high, high to low)
  - Recently updated
  - Best selling
- Item details page:
  - Preview on avatar
  - Description
  - Creator
  - Price
  - Ownership status
  - Purchase button
- No publishing fees for creators

**Pet Shop:**
- Browse pet items
- Same filtering and sorting as avatar shop
- Pet preview

**Group Store:**
- Accessible from group page
- Items sold by group
- Revenue to group funds

**Catalog Page:**
- Accessed through More tab or avatar editor
- Search bar
- Recommended avatar and pet items
- Item type filters
- Combined view of all marketplace items

---

## 10. Avatar & Pet System (2D Only)

### 10.1 Avatar Editor (2D)

- 2D layered avatar system:
  - Base body
  - Skin tone
  - Clothing layers (shirt, pants)
  - Accessories (hats, glasses, etc.)
  - Face/expression
  - Hair
- Drag-and-drop interface
- Color customization for compatible items
- Preview avatar in real-time
- Save avatar
- Multiple outfit slots (e.g., 5 slots)
- Switch between saved outfits
- "Currently wearing" indicator
- Reset to default avatar

### 10.2 Pet Editor (2D)

- 2D pet customization
- Pet types (dog, cat, dragon, etc.)
- Pet accessories
- Pet colors
- Save pet designs
- Equip pet to profile
- Multiple pet slots

### 10.3 Inventory System

**Inventory Categories:**
- Hats
- Hair
- Face
- Shirts
- Pants
- Accessories
- Pets
- Badges
- Game passes (future)

**Inventory Features:**
- Search inventory
- Filter by category
- Sort by:
  - Recently acquired
  - Alphabetical
  - Rarity (future)
- Favorite items
- Item details:
  - Name
  - Description
  - Acquired date
  - Creator
  - Original price
- Equip/unequip items
- Trade items (future)

**Item States:**
- On sale
- Off sale
- Limited (limited quantity, future)
- Limited U (limited time, future)
- Ownership status (owned/not owned)

---

## 11. Game Development & Publishing

### 11.1 Studio Client Features

- Creator dashboard for Studio users
- Game project management
- Create new game project
- Game settings:
  - Title
  - Description
  - Genre
  - Tags
  - Age rating (All, 9+, 13+)
  - Visibility (Public, Private, Friends Only, Group Only)
- Upload game thumbnails (multiple)
- Upload game icon
- Game version management
- Draft vs Published states
- Publish game
- Update published game
- Unpublish game
- Delete game project

### 11.2 Map Import Placeholder

- Placeholder UI for Roblox map import (future feature)
- File upload interface
- Import settings
- Conversion status (for future 3D phase)

### 11.3 Game Metadata

**Required Fields:**
- Game title
- Description
- Genre selection
- Tags (multiple)
- Age rating

**Optional Fields:**
- Max players
- Game type (single-player, multiplayer)
- Developer notes
- Update log

### 11.4 Game Management Tools

- Game analytics dashboard:
  - Total visits
  - Current players
  - Peak concurrent players
  - Likes/dislikes
  - Favorites count
  - Revenue (future)
  - Player retention
  - Average session time
- Update game details
- Manage game thumbnails
- Moderate game comments (future)
- Respond to feedback

### 11.5 Developer Tools

- Project file management
- Asset management (images, sounds, etc.)
- Collaboration tools (future)
- Version control (basic)
- Testing environment

---

## 12. Games & Discovery

### 12.1 Game Page

**Game Information Display:**
- Game title
- Creator name (link to profile)
- Description
- Genre and tags
- Age rating
- Current players count
- Total visits
- Likes/dislikes ratio
- Favorites count
- Last updated date
- Thumbnails/screenshots carousel

**Game Actions:**
- Play button (primary action)
- Favorite game
- Like/dislike game
- Follow game (get update notifications)
- Follow creator
- Share game (copy link)
- Report game

**Additional Tabs:**
- About (description, details)
- Store (game passes, future)
- Servers (future, for multiplayer)
- Updates (changelog)

### 12.2 Game Discovery & Sorting

**Sort Options:**
- Most Popular (by current concurrent players)
- Most Visited (total plays)
- Top Rated (likes/dislikes ratio)
- Featured (staff-picked)
- Recently Updated
- New/Recently Created

**Search:**
- Search by keyword
- Search by tags
- Search by creator name

**Genre Filters:**
- All
- Survival
- PvP
- Roleplay
- Obby (Obstacle Course)
- Action
- Strategy
- Adventure
- Simulation
- Horror
- Racing
- Sports

### 12.3 Game Sessions

- Track "Players in game" count
- Real-time player count updates
- Session tracking for analytics
- Join friend in same game (future: same server instance)

---

## 13. Main Pages & Navigation

### 13.1 Home Page

**Sections:**
- **Friends to Join:** Shows friends currently online/in-game with "Join" button
- **Events:** Platform events, limited-time activities
- **Continue Playing:** Recently played games
- **Favorites:** User's favorited games
- **Recommended:** Personalized game recommendations based on history
- **Popular Now:** Trending games
- **New Releases:** Recently published games
- **Group Activity:** Recent shouts and updates from joined groups

**Home Feed:**
- Friend activity (who's playing what)
- Group shouts from joined groups
- Followed creator updates
- Platform announcements

### 13.2 Games Page

**Layout:**
- Search bar at top
- Genre filter tabs
- Sort dropdown
- Game grid/list view toggle
- Pagination or infinite scroll

**Genre Sections:**
- Popular
- Survival
- PvP
- Roleplay
- Obby
- Action
- Strategy
- And more...

### 13.3 Catalog Page

- Accessed through More tab or avatar editor
- Search bar
- Recommended avatar and pet items
- Item type filters (dropdown or sidebar)
- Price filters
- Premium filter
- Sort options
- Grid view of items
- Quick preview on hover

### 13.4 Create Page

**For Studio Clients:**
- Game projects list
- "Create New Game" button
- Project cards with:
  - Thumbnail
  - Title
  - Status (Draft/Published)
  - Last edited
  - Quick actions (Edit, Publish, Delete)
- Creator dashboard link
- Developer resources
- Tutorials and documentation links

**For Non-Studio Clients:**
- Prompt to become a Studio Client
- Benefits of being a creator
- Getting started guide

### 13.5 Notifications Page

- List of all notifications
- Filter by type
- Mark as read/unread
- Mark all as read
- Delete notification
- Notification settings link
- Real-time updates via Socket.IO

### 13.6 Settings Page

**Account Settings:**
- Change username
- Change display name
- Change email
- Change password
- Enable/disable MFA
- Account security
- Login history

**Privacy Settings:**
- Profile visibility
- Who can send friend requests
- Who can send messages
- Online status visibility
- Last seen visibility

**Notification Settings:**
- Enable/disable notification types
- Email notifications toggle
- Push notifications (future)

**Chat Settings:**
- Chat mode (Everyone, Friends Only, Disabled)
- Message filtering level
- Block list management

**Theme Settings:**
- Dark theme (default)
- Light theme toggle
- Theme preview

**Parental Controls:**
- (If child account) View restrictions
- (If parent account) Manage child accounts

**Language & Region:**
- Language selection
- Timezone

**Billing & Premium:**
- Premium status
- Payment methods (future)
- Transaction history
- AdventureBux balance

### 13.7 More Page

**Menu Items:**
- Settings
- Friends
- Groups
- Messages
- Blog
- Inventory
- Premium
- Catalog
- Support
- Log out
- Switch Accounts

### 13.8 Support Page

- FAQ sections
- Contact support form
- Live chat support
- Ticket status
- Community guidelines
- Terms of service
- Privacy policy

### 13.9 Blog Page

- Platform news and updates
- Developer spotlights
- Event announcements
- Community highlights
- Pagination for posts
- Post categories

### 13.10 Friends Page

- Friends list
- Friend requests (incoming/outgoing)
- Best friends section
- Search friends
- Filter online/offline/in-game
- Quick actions per friend

### 13.11 Groups Page

- My groups list
- Group invitations
- Discover groups
- Create group button
- Search groups

### 13.12 Messages Page

- Inbox
- Sent messages
- Compose new message
- Message threads
- Search messages
- Archive messages

### 13.13 Inventory Page

- All owned items
- Category filters
- Search inventory
- Equip items
- Item details

### 13.14 Premium Page

- Premium benefits overview
- Subscribe button
- Current premium status
- Renewal date
- Premium-exclusive items showcase
- Manage subscription

---

## 14. Navigation Structure

### 14.1 Top Navigation Bar

**Always Visible:**
- Logo (links to Home)
- Search bar (global search)
- Navigation links:
  - Home
  - Games
  - Catalog
  - Create
- Right side:
  - AdventureBux balance display
  - Notifications icon (with unread badge)
  - Messages icon (with unread badge)
  - Profile dropdown

**Profile Dropdown Menu:**
- Profile link
- Settings
- Inventory
- Premium
- Switch Account
- Log out

### 14.2 Mobile Navigation

- Hamburger menu
- Bottom navigation bar:
  - Home
  - Games
  - Catalog
  - Notifications
  - More (menu)
- Responsive design
- Touch-optimized controls

---

## 15. Safety, Moderation & Parental Controls

### 15.1 Content Moderation

**Automated Moderation:**
- AI-assisted content filtering for:
  - Chat messages
  - Usernames and display names
  - Group names and descriptions
  - Profile statuses
  - Wall posts
  - Uploaded images (ads, thumbnails, covers, avatars)
- Real-time profanity filter
- Pattern detection for:
  - Personal information (email, phone, address)
  - URLs and external links
  - Inappropriate content
  - Spam patterns

**Human Moderation:**
- Review queue for flagged content
- Manual review of reported content
- Appeal review
- Policy enforcement

### 15.2 Report System

**Reportable Content:**
- User profiles
- Games
- Groups
- Ads
- Messages
- Wall posts
- Items

**Report Categories:**
- Bullying/harassment
- Inappropriate content
- Scam/fraud
- Spam
- Personal information shared
- Impersonation
- Cheating/exploiting
- Other (with description)

**Report Process:**
- Report button on all content
- Report form with category selection
- Optional description
- Submit report
- Report logged with:
  - Reporter ID
  - Reported content/user
  - Category
  - Description
  - Timestamp
  - Evidence (screenshots, logs)

### 15.3 Moderation Tools (Staff Dashboard)

**Dashboard Features:**
- Reports queue (sorted by priority)
- User search and lookup
- Content review interface
- Ban/mute/timeout tools
- View user history:
  - Previous warnings
  - Previous bans
  - Report history (as reporter and reported)
  - Account age
  - Login patterns
- View reported content with context
- Moderation actions:
  - Approve content
  - Reject content
  - Delete content
  - Warn user
  - Mute user (temporary chat ban)
  - Suspend user (temporary account suspension)
  - Ban user (permanent)
  - IP/device ban
- Action logging (audit trail)
- Appeal review interface
- Bulk actions for spam

**Moderation Actions:**

**Soft Actions:**
- Warning message (sent to user)
- Temporary mute (chat only, duration specified)
- Temporary suspension (full account, duration specified)
- Content removal

**Hard Actions:**
- Permanent ban with recorded reason
- Device/IP ban
- Content deletion
- Account termination

### 15.4 Age-Based Restrictions

**Young Users (Under 13):**
- Strict chat filter (aggressive blocking)
- No DMs with strangers by default
- Friend requests require approval
- Chat restricted to friends-only or disabled
- Cannot share personal information
- Restricted group joining
- Purchase restrictions (require parental approval)
- Limited profile visibility

**Older Users (13+):**
- Looser chat filters (still moderated)
- More social features enabled
- Can join groups freely
- Standard marketplace access

**Age Verification:**
- Age entered during signup
- Cannot be easily changed
- Parental verification for young accounts

### 15.5 Parental Controls

**Parent Account Features:**
- Link parent account to child accounts
- Parent dashboard to manage multiple children
- Require parental email verification for young users

**Parental Control Options:**

**Time Management:**
- Set maximum daily playtime
- Set maximum weekly playtime
- Schedule allowed play times (e.g., only after 3 PM on weekdays)
- Session time warnings

**Social Restrictions:**
- Disable chat completely
- Restrict chat to friends-only
- Disable friend requests
- Disable group joining
- Approve friends manually
- Approved friends list (whitelist)

**Marketplace Restrictions:**
- Disable all purchases
- Require PIN for purchases
- Set daily/weekly spending limits
- Approve purchases manually
- View purchase history

**Activity Monitoring:**
- View activity logs:
  - Friends added/removed
  - Groups joined
  - Games played (with duration)
  - Purchases made
  - Messages sent/received (count, not content)
  - Reports made/received
- Real-time notifications for parent:
  - Child received friend request
  - Child made purchase
  - Child joined new group
  - Child reported or was reported
- Weekly activity summary email

**Content Restrictions:**
- Age-appropriate game filtering
- Block specific games
- Block specific users from contacting child

### 15.6 Safe Chat System

**Chat Filtering Levels:**

**Level 1 (Strictest - Young Users):**
- Whitelist-based (only allowed words can be sent)
- No numbers
- No URLs
- No personal information
- Pre-defined safe phrases

**Level 2 (Moderate - Older Users):**
- Blacklist-based (blocked words filtered)
- URLs blocked
- Personal information patterns blocked
- More natural conversation allowed

**Level 3 (Standard - Adults):**
- Standard profanity filter
- Spam detection
- Still monitors for severe violations

**Chat Safety Features:**
- Real-time filtering
- Post-moderation review of flagged messages
- Context-aware filtering
- Multiple language support
- Regular filter updates

### 15.7 Session Safety

- Rate limiting for:
  - Messages sent per minute
  - Friend requests per hour
  - Group joins per day
  - Account creation per IP
- CAPTCHA challenges for suspicious behavior:
  - Multiple accounts from same IP
  - Rapid-fire actions
  - Mass friend requests
  - Spam patterns
- Automatic temporary restrictions for suspicious activity
- Fraud detection algorithms

---

## 16. Logging, Analytics & System Administration

### 16.1 Security Logging

**Logged Events:**
- All login attempts (successful and failed)
- Password changes
- Email changes
- Account creation
- Account deletion
- Ban/unban actions
- IP address changes
- Device fingerprint changes
- Suspicious activity detections

**Log Storage:**
- Timestamp
- User ID
- Action type
- IP address
- Device fingerprint
- Result (success/failure)
- Additional context

### 16.2 Audit Logging

**Staff Actions Logged:**
- User bans/unbans
- Content approvals/rejections
- Item grants
- AdventureBux adjustments
- Account modifications
- Appeal decisions
- Policy changes

**Group Actions Logged:**
- Role changes
- Member kicks/bans
- Shout posts
- Wall post deletions
- Store item changes
- Alliance changes

**Transaction Logging:**
- All AdventureBux transactions
- All purchases
- All refunds
- All currency grants

### 16.3 Analytics

**User Analytics:**
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- New user registrations
- User retention rates (1-day, 7-day, 30-day)
- Churn rate
- Average session duration
- Average sessions per user

**Platform Analytics:**
- Most popular games
- Most visited pages
- Top groups by members
- Top creators by game visits
- Marketplace activity (items sold, revenue)
- Ad performance metrics
- Premium subscription rate
- Conversion funnels

**Game Analytics:**
- Visits per game
- Concurrent players per game
- Average playtime per game
- Like/dislike ratios
- Favorites count
- Player retention per game

**Social Analytics:**
- Friend connections made
- Messages sent
- Group activity
- Chat activity

### 16.4 System Roles & Permissions

**User Roles:**
- Regular User (Player/Studio)
- Moderator
- Admin
- Super Admin (Platform Developer)

**Moderator Permissions:**
- View reports
- Review content
- Warn/mute/suspend users
- Delete content
- View user details
- Cannot access system settings

**Admin Permissions:**
- All moderator permissions
- Ban/unban users
- Grant AdventureBux
- Feature games/groups
- Access analytics
- Manage staff accounts
- Cannot access critical system settings

**Super Admin Permissions:**
- All admin permissions
- System configuration
- Feature flags
- Database access
- Server management
- Deploy updates

### 16.5 Configuration & Feature Flags

**Feature Flags:**
- Ad system (on/off)
- Premium membership (on/off)
- Trading system (future, on/off)
- Developer payouts (future, on/off)
- Experimental features toggle
- Maintenance mode
- Registration (open/closed/invite-only)

**System Configuration:**
- Rate limits (adjustable)
- Currency pricing
- Premium pricing
- Maximum file sizes
- Session timeout duration
- Password requirements
- Username restrictions

---

## 17. UI/UX Requirements

### 17.1 Theme System

**Dark Theme (Default):**
- Dark backgrounds
- Light text
- High contrast for readability
- Reduced eye strain
- Modern aesthetic

**Light Theme:**
- Light backgrounds
- Dark text
- Optional toggle in settings

**Theme Implementation:**
- CSS variables/tokens for colors
- No hard-coded colors
- Consistent across all pages
- Smooth theme transition

### 17.2 Responsive Design

**Desktop (1920x1080 and above):**
- Full navigation bar
- Sidebar layouts
- Multi-column grids
- Hover effects

**Tablet (768px - 1024px):**
- Adapted layouts
- Collapsible sidebars
- Touch-friendly buttons

**Mobile (320px - 767px):**
- Mobile navigation (hamburger + bottom bar)
- Single column layouts
- Touch-optimized controls
- Larger tap targets
- Swipe gestures

### 17.3 Performance Optimization

- Lazy loading for:
  - Images (avatars, thumbnails, covers)
  - Game lists
  - Friend lists
  - Group lists
- Infinite scrolling or pagination
- Image compression
- CDN for static assets
- Code splitting
- Caching strategies
- Optimized database queries

### 17.4 Accessibility

- Keyboard navigation support
- Screen reader compatibility
- ARIA labels
- Focus indicators
- Color contrast compliance (WCAG AA)
- Alt text for images
- Captions for videos (future)

### 17.5 Loading States

- Skeleton screens
- Loading spinners
- Progress bars
- Optimistic UI updates
- Error states with retry options

### 17.6 Animations & Transitions

- Smooth page transitions
- Button hover effects
- Modal animations
- Notification pop-ins
- Subtle micro-interactions
- Performance-conscious (no janky animations)

---

## 18. Additional Features

### 18.1 Search Functionality

**Global Search:**
- Search games
- Search users
- Search groups
- Search catalog items
- Autocomplete suggestions
- Recent searches
- Search filters

**Search Results Page:**
- Tabbed results (Games, Users, Groups, Items)
- Relevance sorting
- Filters per category

### 18.2 Favorites System

- Favorite games
- Favorite groups
- Favorite items
- View all favorites in dedicated pages
- Quick access to favorites

### 18.3 Follow System

- Follow game creators
- Get notifications for new games/updates
- Follow games for updates
- Followed creators feed

### 18.4 Like/Dislike System

- Like/dislike games
- Like/dislike ratio display
- Cannot change vote (or limited changes)
- Prevents spam voting

### 18.5 Events System

- Platform-wide events
- Limited-time challenges
- Event rewards (badges, AdventureBux)
- Event page with details
- Event countdown timers
- Event participation tracking

### 18.6 Achievements/Platform Badges

- Platform-level achievements:
  - First game played
  - 10 friends made
  - First purchase
  - 100 hours played
  - Group owner
  - Premium member
  - Early adopter
- Badge display on profile
- Badge collection page
- Badge rarity

### 18.7 Leaderboards

- Top players by:
  - Total playtime
  - Games created
  - Friends count
  - AdventureBux earned
- Top games by:
  - Visits
  - Likes
  - Current players
- Top groups by members
- Weekly/monthly/all-time leaderboards

### 18.8 Recommendations Engine

- Personalized game recommendations based on:
  - Play history
  - Friends' activity
  - Genre preferences
  - Similar games
- "You might also like" sections
- "Friends are playing" suggestions

### 18.9 Sharing Features

- Share game links
- Share profile links
- Share group links
- Copy link button
- Social media sharing (future)

### 18.10 Localization (Future)

- Multi-language support
- Translated UI
- Translated content (user-generated content remains in original language)
- Region-specific content

---

## 19. Technical Requirements

### 19.1 Database Schema (High-Level)

**Core Tables:**
- Users
- Profiles
- Sessions
- Friends
- BestFriends
- Groups
- GroupMembers
- GroupRoles
- GroupWallPosts
- GroupShouts
- GroupAlliances
- Games
- GameStats
- Inventory
- Items
- Transactions
- AdventureBux
- PremiumSubscriptions
- Notifications
- Messages
- ChatRooms
- ChatMessages
- Ads
- AdCampaigns
- AdAnalytics
- Reports
- ModerationActions
- Bans
- AuditLogs
- Badges
- UserBadges
- ParentalControls
- ActivityLogs

**Relationships:**
- One-to-many, many-to-many relationships
- Foreign keys with proper constraints
- Indexes for performance
- Cascading deletes where appropriate

### 19.2 API Structure

**RESTful API Endpoints:**
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/profiles/*` - Profile data
- `/api/friends/*` - Friends system
- `/api/groups/*` - Group management
- `/api/games/*` - Game data
- `/api/catalog/*` - Marketplace
- `/api/inventory/*` - User inventory
- `/api/transactions/*` - Currency transactions
- `/api/messages/*` - Messaging
- `/api/notifications/*` - Notifications
- `/api/ads/*` - Ad system
- `/api/moderation/*` - Moderation tools
- `/api/admin/*` - Admin functions

**WebSocket Events (Socket.IO):**
- `presence:update` - User status changes
- `message:new` - New message
- `notification:new` - New notification
- `friend:online` - Friend came online
- `chat:typing` - User typing indicator
- `game:playercount` - Real-time player count updates

### 19.3 File Storage

**Cloud Storage Structure:**
- `/avatars/` - User avatars
- `/game-thumbnails/` - Game thumbnails
- `/game-icons/` - Game icons
- `/group-icons/` - Group logos
- `/group-covers/` - Group cover photos
- `/ads/` - Ad images
- `/items/` - Catalog item images
- `/badges/` - Badge images

**File Requirements:**
- Image format validation
- File size limits
- Image compression
- Malware scanning
- CDN integration

### 19.4 Security Requirements

- HTTPS only
- CORS configuration
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention
- CSRF protection
- Secure headers (helmet.js)
- Content Security Policy
- Regular security audits
- Dependency vulnerability scanning

### 19.5 Performance Requirements

- Page load time < 2 seconds
- API response time < 500ms
- Real-time message delivery < 100ms
- Support 10,000+ concurrent users
- Database query optimization
- Caching strategy (Redis)
- Load balancing (future)
- Horizontal scaling capability

### 19.6 Backup & Recovery

- Daily database backups
- Backup retention (30 days)
- Disaster recovery plan
- Data redundancy
- Point-in-time recovery capability

---

## 20. Development Milestones

### Milestone 1 — Core Setup ($50)

**Deliverables:**
- User account system (Player and Studio roles)
- Authentication (JWT, email verification, password reset)
- User permissions system
- Basic frontend structure (Next.js + React)
- Basic backend structure (Node.js + Express)
- Database setup (PostgreSQL + Prisma)
- User registration and login pages
- Basic profile page
- Dark theme implementation

### Milestone 2 — Group System ($50)

**Deliverables:**
- Group creation and management
- Group roles and permissions
- Group member management
- Group wall with posts
- Group shout with image support
- Group cover photo upload
- Old Roblox-style group ads system:
  - Ad creation and upload
  - Bidding system with AdventureBux
  - Ad rotation algorithm
  - Ad analytics
  - Ad moderation queue
- Group discovery and search

### Milestone 3 — Profile & Social Features ($50)

**Deliverables:**
- Friends system (unlimited friends)
- Best friends system
- Friend requests and notifications
- Real-time presence system (online/offline/in-game/last seen)
- Profile statuses
- Username and display name change
- Notifications system
- Messaging system (DMs and group chats)
- Chat filtering and safety features
- Best Friends page
- Friends page

### Milestone 4 — Avatar, Pets & Main Pages ($50)

**Deliverables:**
- 2D avatar editor UI
- 2D pet editor UI
- Inventory system
- Catalog page with search and filters
- Avatar shop (no publishing fees)
- Creator dashboard for Studio clients
- Game management UI
- Project management tools
- Map import placeholder
- All main pages:
  - Home page (with all sections)
  - Games page (with discovery)
  - Create page
  - Notifications page
  - Settings page
  - More page
  - Support page with live chat
- Navigation structure (top nav, mobile nav)

### Milestone 5 — Marketplace, Safety & Final Polish ($50)

**Deliverables:**
- AdventureBux economy system
- Transaction logging
- Premium membership system
- Group store functionality
- Group alliances
- Marketplace features (filters, sorting)
- Content moderation tools:
  - Automated filtering
  - Report system
  - Staff moderation dashboard
  - Ban/mute/suspend tools
- Parental controls:
  - Parent account linking
  - Activity monitoring
  - Restriction settings
  - Playtime limits
- Age-based restrictions
- Safe chat implementation
- Final UI polish and bug fixes
- Performance optimization
- Testing and QA
- Documentation
- Deployment

---

## 21. Future Enhancements (Post-Launch)

### Phase 2 - 3D Integration
- 3D avatar system
- 3D game engine integration
- Roblox map import functionality
- 3D pet system
- In-game 3D chat

### Phase 3 - Advanced Economy
- Developer payouts (revenue sharing)
- Game passes
- Developer products
- Trading system
- Limited items
- Item resale marketplace
- Virtual economy analytics

### Phase 4 - Social Expansion
- Voice chat
- Video chat (moderated)
- Streaming integration
- Tournaments and competitions
- Clans/teams system
- Social media integration

### Phase 5 - Platform Growth
- Mobile apps (iOS, Android)
- Console support
- VR support
- Cross-platform play
- Internationalization
- Regional servers
- CDN expansion

---

## 22. Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average session duration
- Sessions per user per day
- User retention (1-day, 7-day, 30-day)
- Churn rate

### Social Metrics
- Average friends per user
- Messages sent per day
- Groups created
- Group membership average
- Friend requests accepted rate

### Content Metrics
- Games published
- Games played
- Average playtime per game
- Game likes/dislikes ratio
- Creator retention

### Economic Metrics
- AdventureBux transactions
- Premium subscription rate
- Average revenue per user (ARPU)
- Marketplace transaction volume
- Ad campaign spending

### Safety Metrics
- Reports submitted
- Reports resolved
- Average resolution time
- False positive rate
- User satisfaction with moderation

---

## 23. Compliance & Legal

### Terms of Service
- User agreement
- Acceptable use policy
- Content guidelines
- Developer terms
- Premium terms

### Privacy Policy
- Data collection disclosure
- Data usage
- Data sharing
- User rights
- Cookie policy
- COPPA compliance (for users under 13)
- GDPR compliance (if applicable)

### Community Guidelines
- Behavior expectations
- Content rules
- Consequences for violations
- Appeal process

### Copyright & DMCA
- Copyright policy
- DMCA takedown process
- Counter-notification process
- Repeat infringer policy

---

## 24. Support & Documentation

### User Documentation
- Getting started guide
- How to play games
- How to create games
- How to use avatar editor
- How to create groups
- How to use ads system
- Safety tips for kids
- Parent guide

### Developer Documentation
- API documentation
- Game development guide
- Publishing guidelines
- Best practices
- Code examples
- Troubleshooting

### Support Channels
- Help center (FAQ)
- Support tickets
- Live chat support
- Email support
- Community forums (future)
- Discord server (future)

---

## End of Requirements Document

**Total Estimated Development Time:** 5 Milestones
**Total Budget:** $250 ($50 per milestone)
**Technology Stack:** React, Next.js, Node.js, Express, PostgreSQL, Prisma, Socket.IO, JWT, Cloud Storage
**Target Launch:** After Milestone 5 completion

This document represents the complete functional requirements for the AdventureBlox platform. All features listed are expected to be implemented across the 5 development milestones, with the exception of items explicitly marked as "future" enhancements.

