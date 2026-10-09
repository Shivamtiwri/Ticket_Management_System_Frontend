
     cd frontend
     npm install
     .env.example .env

   Tests:

     npm test
     npm run lint

   Component and page tests mock service calls and do not require a live backend. Coverage is not configured because a Vitest coverage provider is not installed; no dependency has been added.

   .env:

     VITE_API_URL=http://localhost:5000/api

   Start the dev server (port 5173):

     npm run dev

   Production build:

     npm run build
     npm run preview
