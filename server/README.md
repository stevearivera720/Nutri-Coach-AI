NutriCoach proxy server

This tiny Express server exposes a single endpoint used by the frontend to fetch a daily nutrition tip from an RSS feed and avoid CORS issues.

Setup

1. Install dependencies in the server folder:
   npm install

2. Start the server:
   npm start

By default the server listens on port 4001 and exposes GET /daily-tip which returns JSON: { "tip": "..." }

You can change the RSS feed source by setting the RSS_URL environment variable before starting the server.

Frontend

The frontend will try to fetch the tip from <server_base>/daily-tip where <server_base> is taken from localStorage key "server_base". If you run the server locally on port 4001 you can set this value in the browser console:

localStorage.setItem('server_base','http://localhost:4001')

This ensures the frontend uses the server endpoint for daily tips and avoids CORS issues when scraping external pages.