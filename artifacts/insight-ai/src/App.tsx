import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useUser } from '@clerk/react';
import { dark } from '@clerk/themes';
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import MetricsPage from "@/pages/metrics";
import ReportsPage from "@/pages/reports";
import KpiTargetsPage from "@/pages/kpi-targets";
import AiAssistantPage from "@/pages/ai-assistant";
import SettingsPage from "@/pages/settings";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: typeof window !== "undefined" ? `${window.location.origin}${basePath}/logo.svg` : "",
  },
  variables: {
    colorPrimary: "hsl(180 100% 50%)",
    colorForeground: "hsl(230 25% 96%)",
    colorMutedForeground: "hsl(230 10% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(230 25% 10%)",
    colorInput: "hsl(230 25% 15%)",
    colorInputForeground: "hsl(230 25% 96%)",
    colorNeutral: "hsl(230 25% 15%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-md border border-border shadow-xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-semibold text-xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground text-sm font-medium",
    footerActionLink: "text-primary hover:text-primary/80 transition-colors",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary hover:text-primary/80 transition-colors",
    formFieldSuccessText: "text-green-500",
    alertText: "text-foreground",
    logoBox: "flex items-center justify-center h-12 mb-4",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border border-border bg-background hover:bg-muted transition-colors rounded-sm",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium rounded-sm py-2",
    formFieldInput: "bg-input border-border text-foreground rounded-sm focus:ring-1 focus:ring-ring focus:border-ring",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive text-destructive",
    otpCodeFieldInput: "border-border bg-input text-foreground rounded-sm",
    formFieldRow: "mb-4",
    main: "p-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </Route>
  );
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey as string}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/metrics" component={MetricsPage} />
          <ProtectedRoute path="/reports" component={ReportsPage} />
          <ProtectedRoute path="/kpi-targets" component={KpiTargetsPage} />
          <ProtectedRoute path="/ai-assistant" component={AiAssistantPage} />
          <ProtectedRoute path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-900/30 text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Setup Environment Variables</h1>
            <p className="text-sm text-slate-400">
              DataLens is deployed, but the **Clerk Publishable Key** environment variable is missing.
            </p>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-left space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructions:</h2>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2">
              <li>Open your Vercel Dashboard project settings.</li>
              <li>Go to **Environment Variables**.</li>
              <li>Add key: <code className="text-cyan-400 bg-cyan-950/40 px-1 py-0.5 rounded font-mono">VITE_CLERK_PUBLISHABLE_KEY</code></li>
              <li>Set the value from your Clerk Dashboard key (<code className="font-mono text-slate-400">pk_...</code>).</li>
              <li>Click **Save** and **Redeploy** the project.</li>
            </ol>
          </div>

          <p className="text-xs text-slate-500">
            Once saved, run a new deployment on Vercel to bake the variable in!
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;