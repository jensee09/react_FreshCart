# React + Vite

## MySQL configuration

Copy `.env.example` to `.env` and set the connection values for your MySQL server. The named database must already exist; the app creates and updates its tables on first API use. The `.env` file contains connection settings only; FreshCart stores account, cart, wishlist, and order data in MySQL tables. Cart and wishlist actions require a signed-in account.

Keep `.env` private and out of Git. For Vercel deployment, add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` under Project Settings → Environment Variables. Use a hosted MySQL provider and allow its network access from Vercel. Do not upload `.env`.

Vercel serves the React single-page app and the Express API function from this repository. The root URL (`/`) opens the home page; `/api/*` requests are handled by `api/[...path].js`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.


in my freshcart in when a user1 in My Order History, My Wishlist and checkout and card in own data not all data particulat user purchase and add to card data and admin  when a login then display and admin panel page and in login form in proper select role button like admin and user and current select button proepr add background and Support: +1 (800) 555-FRESH this number like admin phone number this is a dynamically add a dmin profile side and remove Switch Role: like this and why not work category wise filter then work proper.
