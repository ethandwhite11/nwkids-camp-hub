# NW Kids Camp Hub

Leader hub for NW Kids Summer Camp. Built with React + Vite + Firebase.

---

## Deploying (No terminal required)

### Step 1 — Create a GitHub repository
1. Go to **github.com** and sign in (create an account if needed)
2. Click the **+** icon → **New repository**
3. Name it `nwkids-camp-hub`
4. Leave it **Public**
5. Click **Create repository**

### Step 2 — Upload the files
1. On the repo page, click **uploading an existing file**
2. Drag the entire `nwkids-camp-hub` folder contents into the window
3. Click **Commit changes**

### Step 3 — Connect to Netlify
1. Go to **netlify.com** → Sign up / Log in
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → authorize → select `nwkids-camp-hub`
4. Build settings will auto-fill from `netlify.toml` — don't change anything
5. Click **Deploy site**

Netlify will build and give you a live URL in about 60 seconds.

### Step 4 — Update Firestore security rules
In the **Firebase Console** → Firestore Database → **Rules** tab, replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**. This lets anyone read (leaders), but only you can write (admin).

---

## Admin Panel

Access the admin panel by adding `#admin` to the end of your URL:

```
https://your-site.netlify.app/#admin
```

**Bookmark this on your phone's home screen before camp.**

From the admin panel you can:
- Update scores for West One and West Two in real time
- Post an announcement that shows as a banner to all leaders
- Clear the announcement when it's no longer needed

---

## Updating content before camp

Edit the data directly in `src/CampHub.jsx`:

- **FAQ** — find the `FAQ` array near the top, edit or add entries
- **Rules** — find the `RULES` array, edit entries
- **Contacts** — find the `CONTACTS` array, update names/numbers
- **Free Time** — find the `FREE_TIME` array
- **Schedule** — find the `SCHEDULE` object (Day 1 / Days 2-3 / Day 4)
- **Rotation assignments** — find the `ROTATIONS` object

After editing, commit the changes to GitHub — Netlify will auto-redeploy.

---

## Camp dates

Dates are set in the `getCampInfo` function in `CampHub.jsx`:

- **West One:** August 2–5, 2026
- **West Two:** August 5–8, 2026

The app automatically shows the correct camp based on the device's current date.

---

## Sharing with leaders

Just send leaders the plain URL (no `#admin`):

```
https://your-site.netlify.app
```

Add it to your leader onboarding communication. Suggest they add it to their phone's home screen for quick access.
