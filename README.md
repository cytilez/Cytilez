# KaelBnB — Netlify + Functions (GitHub route)

This repo is a ready-to-deploy starter for your Netlify site with a serverless function to fetch Airbnb/Booking iCal.

## Structure
.
├── index.html                # your app entry (replace with your full app)
├── app.js                    # your app code (replace with your full app.js)
├── netlify.toml              # tells Netlify where functions live
└── netlify
    └── functions
        └── fetch-ical.js     # tiny proxy to fetch iCal without CORS issues

## Deploy (GitHub)
1) Create a new GitHub repo and push these files.
2) In Netlify: Add new site → Import from Git → pick the repo.
3) Build command: (leave empty) • Publish directory: "."
4) Deploy. Test the function:
   https://YOUR-SITE.netlify.app/.netlify/functions/fetch-ical?ping=1  -> should return "pong"

## Use in the app
- In your UI, have a "Sync… → Import via Proxy" button that calls:
  /.netlify/functions/fetch-ical?url=<encoded-ical-url>
- On success, parse the returned ICS (text/calendar) and import events.

## Note on data storage
- This starter doesn't include a database; your app will still save locally unless you integrate Supabase/Firebase.
- When you’re ready, add cloud storage to sync data across devices.
