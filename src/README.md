# Nutrinformation AI Coach

This is a small single-page app that helps users with chronic illnesses or dietary restrictions analyze food items using the OpenAI Chat API. The app stores the user's health profile locally (localStorage) and uses a user-provided OpenAI API key stored locally.

Quick start (Windows PowerShell)

1. Install dependencies

```powershell
cd nutrinformation-ai-coach
npm install
```

2. Run dev server

```powershell
npm run dev
```

3. Open http://localhost:5173 and set your OpenAI API key in Settings.

Security note: Do not paste private or production keys on shared/public machines. The app stores the key in localStorage only.

Features included:
- Health profile editor (conditions, allergies, custom)
- Chat-style analysis UI that sends the profile + query to OpenAI
- Local storage persistence

Next steps you can ask me to do:
- Add barcode scanning (camera) for packaged foods
- Improve prompt engineering for more consistent classification output
- Add client-side caching and batch grocery imports

Accessibility and privacy notes:
- The UI uses semantic HTML and aims to be keyboard accessible; please test with screen readers.
- All data and the OpenAI API key are stored in localStorage only and not transmitted to any server except OpenAI.
