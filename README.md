# ori3dta

### How to run this for local development

Create a mongoDB account (I invited y'all to the Ori3dita project), and generate your SRV (database connection string) for CLuster0. Create a new file called .env and populate it with the following:

```
SESSION_SECRET="any string you want"
MONGO_SRV="your mongoDB SRV copied from MongoDB Atlas"
```

Then, run `npm install` to install all necessary dependencies.

Any time you want to test the app, run `npm start` in one terminal to run the backend, and run `npm run dev` in another terminal to run the frontend. Both these commands will automatically re-run if you change a file, so it live updates. I typically have 3 terminals open at all times, one with the backend running, one with the frontend running, and one for git. Make sure your frontend is on localhost:5173 (if it's not, you might have issues with google auth--this could happen if your port 5173 is being used by smth else), and go to localhost:5173 to check out the site!
