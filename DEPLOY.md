Publishing NutriCoach

This project is a Vite + React app. You can publish it using several simple options.

1) GitHub Pages (CI)
- Add the repository to GitHub and push the `main` branch.
- The included GitHub Actions workflow will build and publish the `dist` folder to GitHub Pages using the built-in GITHUB_TOKEN.
- Make sure the repository Pages settings are set to use the `gh-pages` branch.
	- After the first workflow run, verify in GitHub: Settings → Pages that the site is served from the `gh-pages` branch (root or /).

2) Vercel
- Install the Vercel CLI or use the Vercel dashboard.
- Import the GitHub repo; set the framework to "Vite" or leave auto-detect.
- Build command: `npm run build`, Output directory: `dist`.

3) Netlify
- Drag-and-drop the `dist` folder or connect the repo via Netlify.
- Build command: `npm run build`, Publish directory: `dist`.

Local test
- Build locally:

```powershell
npm install
npm run build
npx serve dist
```

Notes
- If you use Azure/OpenAI keys in the app, keep them out of the repo (use Settings UI). The frontend stores keys in localStorage; for a shared deployment consider using a server-side proxy or vault for secrets.
- If you want recipe scraping to reliably work for users, add a server endpoint to proxy the recipe source (server/ already has a small proxy for daily tips).

Self-hosting (private link sharing)
- The `server/` folder contains a tiny Express server that can serve the built `dist/` and provide a `/daily-tip` endpoint.
- To restrict access to only people who have the link, set an environment variable `ACCESS_TOKEN` before starting the server. Users can access the app using `https://yourdomain/?access=THE_TOKEN` once the server is running.

Example (PowerShell):
```powershell
cd server
setx ACCESS_TOKEN "my-secret-token"
npm start
# Share: https://your-server.example.com/?access=my-secret-token
```

The server will set a cookie when a visitor uses the `?access=` query, avoiding repeated prompts.