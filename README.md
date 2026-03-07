# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Recover old Netlify localStorage data (Scheme B)

When the old Netlify domain cannot be opened, but your browser profile still has local data,
you can extract candidate `localStorage` payloads from Chromium LevelDB files.

```sh
npm run recover:localstorage
```

Advanced usage:

```sh
node scripts/export-netlify-localstorage.mjs \
  --origin https://family-wealth-compass-001.netlify.app \
  --browser chrome \
  --profile "/path/to/Chrome/Default" \
  --output ./debug/localstorage-export.json \
  --debug
```

The script writes a JSON report with:
- summary counters
- `bestGuess.financeData` (if recoverable)
- raw findings for debugging and issue diagnosis

## Import recovered data into guest default account

After exporting JSON, open the app in development mode and visit:

- `/debug/recovery`

Paste either:
- the full export report (`bestGuess.financeData`), or
- a direct finance state JSON object (`{ transactions, categories, ... }`).

Click **写入游客默认数据**. The page will:
- ensure a guest account exists,
- merge imported transactions into guest storage,
- switch current session to guest,
- print debug logs both on page and in browser console.
