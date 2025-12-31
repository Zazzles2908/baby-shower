# Baby Shower Interactive Web App

A fun, interactive QR-code based web app for baby showers with multiple activities and milestone surprises.

## Features

- **Digital Guestbook** - Leave wishes and optionally upload photos
- **Baby Pool** - Predict birth date, time, weight, and length
- **Emoji Pictionary** - Solve baby-themed emoji puzzles
- **Advice Capsule** - Leave parenting advice or wishes for baby's 18th birthday
- **Name Voting** - Heart up to 3 baby names you like
- **Milestone Surprises** - Unlock fun surprises as collective goals are reached

## Technology Stack

- **Frontend**: Plain HTML/JavaScript/CSS (no build tools required)
- **Backend**: Google Apps Script (serverless)
- **Storage**: Google Sheets (data) + Google Drive (photos)
- **Optional**: Supabase integration for learning (see [`backend/supabase-integration.md`](backend/supabase-integration.md:1))
- **Hosting**: Netlify (drag-and-drop deployment)

## Project Structure

```
baby-shower-qr-app/
├── index.html                 # Main HTML file
├── styles/
│   ├── main.css              # Main stylesheet with farm theme
│   └── animations.css        # Animation styles
├── scripts/
│   ├── config.js             # Configuration constants
│   ├── api.js                # API communication layer
│   ├── main.js               # Core navigation and utilities
│   ├── guestbook.js          # Guestbook feature
│   ├── pool.js               # Baby pool feature
│   ├── quiz.js               # Emoji pictionary feature
│   ├── advice.js             # Advice capsule feature
│   ├── voting.js             # Name voting feature
│   └── surprises.js          # Milestone and surprise system
├── backend/
│   └── Code.gs               # Google Apps Script backend
├── assets/
│   └── images/               # Illustrations and icons (to be generated)
└── README.md                 # This file
```

## Setup Instructions

### 1. Set Up Google Backend

#### Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet named "BabyShower2025"
3. Add the following tabs:
   - Guestbook
   - BabyPool
   - QuizAnswers
   - Advice
   - NameVotes
   - Milestones

#### Create Google Drive Folder

1. Go to [drive.google.com](https://drive.google.com)
2. Create a new folder named "BabyShower2025"
3. Note the folder ID from the URL (the long string after `/folders/`)
4. Create a subfolder named "GuestbookPhotos"

#### Create Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the contents of [`backend/Code.gs`](backend/Code.gs:1)
4. Paste into the Apps Script editor
5. **Important**: Replace `YOUR_DRIVE_FOLDER_ID_HERE` in the `handlePhotoUpload` function with your actual Drive folder ID
6. Save the project (Ctrl+S or Cmd+S)

#### Deploy as Web App

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Description: "Baby Shower API"
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy**
7. Copy the **Web App URL** (starts with `https://script.google.com/macros/s/.../exec`)

### 2. Configure Frontend

1. Open [`scripts/config.js`](scripts/config.js:1)
2. Replace `YOUR_APPS_SCRIPT_URL_HERE` with your actual Web App URL from step 1.4
3. (Optional) Customize baby names in `CONFIG.BABY_NAMES`
4. (Optional) Adjust milestone thresholds in `CONFIG.MILESTONES`

### 3. Deploy to Netlify

#### Option 1: Drag and Drop (Easiest)

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop the entire project folder (except the `backend/` folder) onto the upload area
4. Wait for deployment to complete
5. Copy the deployed site URL

#### Option 2: Using Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 4. Generate QR Codes

1. Use a QR code generator (e.g., [QRCode Monkey](https://www.qrcode-monkey.com/))
2. Enter your Netlify site URL
3. Customize the QR code design to match your farm theme
4. Download and print the QR codes for tables

## Usage

### For Guests

1. Scan the QR code with their phone camera
2. Welcome screen appears with activity options
3. Tap an activity button to participate
4. Fill out the form and submit
5. See success animation and any unlocked milestones

### For Parents

1. View all submissions in your Google Sheet
2. View uploaded photos in your Google Drive folder
3. Track milestone progress in the Milestones tab
4. Use the data to create a baby shower memory book

## Customization

### Theme and Colors

Edit [`styles/main.css`](styles/main.css:1) to customize:
- Color palette (CSS variables at the top)
- Typography
- Layout and spacing

### Baby Names

Edit `CONFIG.BABY_NAMES` in [`scripts/config.js`](scripts/config.js:1) to change the voting options.

### Quiz Puzzles

Edit `CONFIG.QUIZ_ANSWERS` in [`scripts/config.js`](scripts/config.js:1) to change the emoji puzzles and correct answers.

### Milestone Messages

Edit `MILESTONE_CONTENT` in [`scripts/config.js`](scripts/config.js:1) to customize milestone titles and messages.

## Testing

### Local Testing

1. Open `index.html` in a web browser
2. Note: API calls will fail until you configure the backend URL
3. Test navigation between sections
4. Test form validation
5. Test animations

### Full Testing

1. Deploy backend and frontend
2. Test each feature end-to-end
3. Verify data appears in Google Sheets
4. Verify photos appear in Google Drive
5. Test milestone unlocking

## Troubleshooting

### "API Error" or "Network Error"

- Verify `CONFIG.SCRIPT_URL` is correct in [`scripts/config.js`](scripts/config.js:1)
- Check that the Apps Script is deployed with "Anyone" access
- Try opening the Web App URL in a browser - it should show a blank page (this is normal)

### Photos Not Uploading

- Verify the Drive folder ID is correct in [`backend/Code.gs`](backend/Code.gs:1)
- Check that the folder exists and is accessible
- Ensure the folder has sharing permissions set correctly

### Milestones Not Unlocking

- Check the Milestones tab in your Google Sheet
- Verify that milestone keys match between frontend and backend
- Check that thresholds are set correctly in `CONFIG.MILESTONES`

### QR Code Not Scanning

- Ensure the QR code is printed clearly
- Test with multiple devices (iOS and Android)
- Verify the Netlify site URL is correct

## Security Considerations

- The Web App is set to "Anyone" access, which means anyone with the URL can submit data
- This is acceptable for a baby shower where you want guests to participate easily
- The data is stored in your personal Google account, which only you can access
- Photos are stored in your Google Drive with "anyone with link can view" permissions
- Consider adding a simple passcode if you want to restrict access

## About Supabase

**Important**: Supabase does NOT provide static site hosting for your HTML/CSS/JS files. You still need Netlify (or GitHub Pages, Vercel, etc.) to host your frontend.

Supabase is a **backend platform** that provides:
- PostgreSQL database (can replace Google Sheets)
- Storage for photos/files (can replace Google Drive)
- Edge Functions for API requests (can replace Google Apps Script)
- Authentication and user management

But Supabase **cannot**:
- Serve static HTML/CSS/JS files
- Provide a URL for your web app
- Replace the need for static hosting

**What this means**: You need BOTH services:
1. **Static hosting** (Netlify/GitHub Pages/Vercel) - Hosts your [`index.html`](index.html:1), [`styles/`](styles/), [`scripts/`](scripts/)
2. **Backend/database** (Supabase OR Google) - Stores your data and handles API requests

See [`docs/supabase-capabilities.md`](docs/supabase-capabilities.md:1) for detailed explanation of what Supabase provides and why static hosting is still required.

## Performance Notes

- Google Apps Script has built-in rate limiting (~20,000 executions per day)
- With 50 guests and ~5 submissions each, you'll be well within limits
- Photos are limited to 5MB per upload to prevent abuse
- Total storage depends on your Google Drive quota

## Future Enhancements

- Add real-time leaderboard for quiz scores
- Create a photo gallery view for parents
- Add email notifications for new submissions
- Create a printable summary report
- Add video upload support
- Implement a countdown timer to baby's due date

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the [implementation plan](plans/implementation-plan.md:1)
3. Review the [backend architecture](plans/backend-api-architecture.md:1)

## Credits

Created with love for Baby Shower 2026
Theme: Warm, rustic farm with earthy tones

## License

Personal use only. Not for redistribution or commercial use.
