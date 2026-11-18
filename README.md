# Conan Travel Planner

A responsive travel planning web app built for **IMS566 Advanced Web Design Development and Content Management**.
This website is NOT the official website of Conan Travel Planner. It was developed strictly for learning purposes (IMS 566).

- **Live website (GitHub Pages): https://harith-gti.github.io/conantravelplanner/
- **GitHub repository:** _paste your repository link here_

## Features
- **Login, Register, Forgot password**: username and password only, with validation and clear error messages (simulated, no database), show/hide password and a demo account button
- **Per-account data**: a new account starts with zero data; the demo account has sample data
- **Feature summary strip** on every page: Plan trips and itineraries, Track expenses and budgets, Discover hidden gems, Pack smarter
- **Dashboard**: summary cards, next journey, packing progress, reminders and two Chart.js charts (spending by category, monthly spending)
- **Data pages**: My Trips, Expenses and Itinerary (tables with search, filter, **column sorting A-Z / Z-A**, add, edit, delete); Expenses and Itinerary have picture boxes. Deleting a trip also deletes its expenses, activities and packing items
- **Destinations**: a dream list board (Dreaming, Planning, Visited) with photos, priority, budget and notes, plus **Get Ideas**: 60+ places with photos, a link to each country's official tourism website, a budget and days filter (rough cost estimate), and a Shuffle button. Places already in your dream list are hidden
- **World Map**: Google Maps with a search box for any full address, landmark or place
- **Budget & Currency**: budget by category with a doughnut chart, plus a converter for all currencies (live rates)
- **Packing**: smart list generated from trip length and travel style, progress ring, copy list
- **Online saving (optional)**: with a free Firebase Realtime Database connected, each account's data is kept online and appears on any device after login (see below)
- **Static sidebar**: the menu always fits on screen without a scrollbar, even on short browser windows
- **Dark mode** toggle (saved in the browser), responsive navigation (sidebar on desktop, collapsible menu on mobile), identical footer and metadata on every page

## Test the login
- Username: `demo`
- Password: `Demo@1234`
- Or create your own account on the Register tab (username and password only). A new account starts empty.
- Error examples to try: wrong password, unknown username, empty fields, password without a number.

> Authentication is a browser-only demonstration. Passwords are stored in localStorage and this is not production-grade security.

## Frameworks and libraries
Bootstrap 5.3.3, Chart.js 4.4.3, Font Awesome 6.5.2, Google Fonts (Poppins), Google Maps embed, open.er-api.com (exchange rates), optional Unsplash API (photos), official national tourism websites (links).
All libraries load from a CDN, so an internet connection is needed.

## How the code is organised
Each page is a small HTML shell (metadata, CDN links, one `<main id="view">`). The shared navigation bar, feature strip and footer are inserted by `js/layout.js`, and each page script (`js/dashboard.js`, `js/trips.js`, ...) draws that page's content. This keeps the menu and footer identical on every page.

```
login.html  index.html  trips.html  expenses.html  itinerary.html
destinations.html  map.html  budget.html  packing.html
css/style.css                 all styles (light and dark theme variables at the top)
assets/images/                dashboardbanner.jpg  expensesbanner.jpg  itinerarybanner.jpg  loginbackground.jpg
                              favicon.svg  favicon.png  apple-touch-icon.png  (tab icon / logo)
js/layout.js                  navigation bar, feature strip, footer, dark mode, logout (every page)
js/core.js                    storage, helpers, sample data, chart helpers, add/edit form, reusable data table (crud)
js/auth.js                    login, register, reset password
js/cloud.js                   optional online saving (Firebase REST), account hashing, sync between devices
js/dashboard.js  trips.js  expenses.js  itinerary.js  destinations.js  map.js  budget.js  packing.js   (one per page)
js/data.js                    destination ideas, official websites, cost estimator, photo loader
js/config.js                  optional settings: Unsplash key, online database address
```

## Save your data online (optional)
GitHub Pages can only host files, so by default each browser keeps its own data. To keep an account's data online
(so it is still there on your phone, another laptop or another browser), connect a free Firebase Realtime Database:

1. Go to https://console.firebase.google.com, click **Add project**, name it, and turn Google Analytics off.
2. In the left menu choose **Build > Realtime Database > Create Database**. Pick the location **Singapore** and start in **test mode**.
3. Open the **Rules** tab, replace the rules with the text below and click **Publish** (test mode rules expire after 30 days, these do not):
   ```
   { "rules": { ".read": true, ".write": true } }
   ```
4. On the **Data** tab copy the address at the top, for example `https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app`.
5. Paste it between the quotes of `databaseUrl` in `js/config.js`, commit and push to GitHub.

How it works: every change is saved in the browser first and sent online a moment later. When you log in, or open a page,
the newer copy (this browser or the database) is kept. If you were offline, the changes are sent when you are back online.
The shared **demo** account is saved online too (`syncDemo: true` in `js/config.js`), so its data is the same on every device. Everyone who logs in as `demo` shares that one set of data; set `syncDemo: false` to keep demo data in each browser only.
Leave `databaseUrl` empty to save in the browser only, exactly as before.

Limits (this is a learning project): the rules above let anyone who knows the database address read and write it, and the
address is visible in the page source. Passwords are stored online only as a SHA-256 hash, but a hash is not real security,
and the simulated "forgot password" lets anyone who knows a username set a new password. Use made-up data only. A real
application would use Firebase Authentication with rules for each user.

## Run and deploy
For licensed destination photos with credits, paste a free Unsplash Access Key into `js/config.js`.
Open `login.html` in Google Chrome (a local server such as VS Code Live Server or GitHub Pages is recommended so online services load reliably), or publish with GitHub Pages (Settings > Pages > main branch, root folder).
All trips, expenses and places are demonstration data. Data is saved in your browser only.

## Credits
Banner and background images are used for learning purposes only. Destination photos belong to their owners.
