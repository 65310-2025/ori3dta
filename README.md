# Ori3dta

### How to run this for local development

Create a mongoDB account and generate your SRV (database connection string). Copy `.env.template` to `.env` and populate all the fields with your own values. For `SESSION_SECRET`, you can put any random string, preferably a long one generated by `uuidgen` or similar. Do the same for the `.env` file in the `client` directory.

Then, run `npm install` to install all necessary dependencies.

To run the app, run `npm start` in one terminal to run the backend, and run `npm run dev` in another terminal to run the frontend. Both these commands will automatically re-run if you change a file, so it live updates. Make sure your frontend is on localhost:5173 (if it's not, you might have issues with google auth--this could happen if your port 5173 is being used by smth else), and go to localhost:5173 to check out the site!
