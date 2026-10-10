# Deploy the five SaaS products independently

The Founder Agent remains the default app when `VITE_PRODUCT` is unset. Each SaaS can use the same GitHub repository and `app/` Root Directory, with its own Vercel project and environment variable.

## Shared Vercel settings

- Git repository: `jalchaudhary08/founder-agent`
- Production branch: `main`
- Root Directory: `app`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Create each project separately from the same repository. In each project's **Settings → Environment Variables**, set the following variable for **Production** (and Preview if you want preview deployments):

| Vercel project name | Environment variable | Value |
| --- | --- | --- |
| `revenueleak` | `VITE_PRODUCT` | `revenue-leak` |
| `driftcheck` | `VITE_PRODUCT` | `tracking-drift` |
| `reportcheck` | `VITE_PRODUCT` | `agency-report-qa` |
| `labelkit` | `VITE_PRODUCT` | `food-label` |
| `closeline` | `VITE_PRODUCT` | `accounting-close` |

After setting the variable, redeploy each project so Vite includes the correct product at the domain root. The app's existing `/experiments/*` routes remain available in the Founder Agent deployment.

## Before calling a product production-ready

- Open the production URL on mobile and desktop.
- Test direct URL refresh and section navigation.
- Test every input, validation state, and error state.
- Confirm that no customer file or product data is sent before a real verified payment flow is connected.
- Configure only the environment secrets needed by that project; never commit secrets to Git.
- Check Vercel deployment logs and test API endpoints before enabling real customer processing.

## Important limitations

This change enables a product to render at `/` when its `VITE_PRODUCT` is set. It does **not** create Vercel projects, assign domains, connect payment providers, or prove that the build passes. Those steps must be completed and verified in Vercel. Current paid workflows remain blocked until payment verification is implemented.
