# Conan Travel Planner

A responsive travel planning web app built for **IMS566 Advanced Web Design Development and Content Management**.
This website is NOT the official website of Conan Travel Planner. It was developed strictly for learning purposes (IMS 566).

- Live website (GitHub Pages): https://harith-gti.github.io/conantravelplanner/
- GitHub repository: https://github.com/Harith-gti/conantravelplanner

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
