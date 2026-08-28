# React + Vite

## ⚠️ DEMO_MODE

`src/constants/config.js` exports `DEMO_MODE`, currently `true`. While on, a freshly registered
account's empty shipment/offer lists get simulated "other users'" activity trickled in over time
(see the demo-trickle effects in `src/pages/carrier/CarrierShipments.jsx` and
`src/pages/shipper/ReceivedOffers.jsx`) so a demo/tester isn't stuck looking at a blank screen.
It never touches the user's own data.

**Set `DEMO_MODE = false` before wiring this app to a real backend.** That one flag disables
every simulated-activity code path with no other changes needed.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
