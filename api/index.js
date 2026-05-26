// This file is the Vercel serverless function entrypoint.
// It imports the pre-compiled Express app from the esbuild output.
// Using plain JS avoids Vercel re-compiling the TypeScript source with its own strict settings.
import { app } from "../artifacts/api-server/dist/app-export.mjs";

export default app;
