# Architecture & Technical Details for Developers: Vault of Seekers

## I. Project Structure & Core Technologies

### Root Directory:

* `next.config.ts`: Next.js configuration (e.g., image optimization domains, build-time checks).
* `tailwind.config.ts`: Configuration for Tailwind CSS, including custom fonts, colors, and plugins like tailwindcss-animate.
* `tsconfig.json`: TypeScript compiler options, defining paths, target ECMAScript version, JSX mode, etc.
* `package.json`: Lists project dependencies, scripts (dev, build, start, lint), and project metadata.
* `apphosting.yaml`: Configuration file for deployment on Firebase App Hosting.
* `.env`: Stores environment variables, primarily Firebase project credentials prefixed with `NEXT_PUBLIC_`.
* `components.json`: Configuration for ShadCN UI, defining component paths, style, and Tailwind settings.

### src/ Directory (Main Source Code):

#### app/ (Next.js App Router):

* `layout.tsx` (Root Layout): The outermost layout applying global styles, fonts, the PageWrapper for themes/animations, and the Toaster for notifications.
* `globals.css`: Contains Tailwind CSS directives (@tailwind base/components/utilities), CSS custom property definitions for theming (light/dark modes), and any global base styles.
* `page.tsx` (Root Page): The entry point for the splash screen (`SplashScreenClient.tsx`).
* `login/page.tsx`: The login page, utilizing `AuthForm.tsx`.
* `(app)/` (Route Group): Organizes authenticated/main application routes without affecting URL paths.

  * `layout.tsx`: Nested layout for the main application views, including `AppHeader`, a Suspense boundary for child pages, and a footer.
  * `home/page.tsx`: The primary user interface for making API queries.
  * `history/page.tsx`: Displays the user's past search activities.
  * `profile/page.tsx`: Allows users to manage their profile, theme, and API key configurations.

#### components/:

* `ui/`: Contains the ShadCN UI components (Button, Card, Dialog, Input, etc.). These are generally client components.
* **Custom Components:**

  * `AppHeader.tsx`: Site navigation bar, displays links and auth status.
  * `AuthForm.tsx`: Handles Google Sign-In and guest continuation.
  * `PageWrapper.tsx`: Manages theme application (light/dark/system) and page transition animations.
  * `SiteLogo.tsx`: Simple component to display the site's abbreviated logo ("VOS").
  * `SplashScreenClient.tsx`: Implements the animated splash screen.
  * `LoadingFallback.tsx`: A simple loading indicator used with Suspense.

#### hooks/:

* `use-toast.ts`: A custom hook providing a toast notification system, inspired by `react-hot-toast`.

#### lib/:

* `utils.ts`: Contains utility functions, notably `cn` for conditionally joining class names (using `clsx` and `tailwind-merge`).
* `firebase.ts`: Initializes the Firebase app and exports the auth instance.

### Core Technologies:

* **Next.js (v15 - App Router):** Server-side rendering, static site generation, and improved routing.
* **React (v18):** Component-based UI library.
* **TypeScript:** Enhances code quality through static typing.
* **ShadCN UI:** Customizable UI components built on Radix UI + Tailwind.
* **Tailwind CSS:** Utility-first styling.
* **Firebase:** Google Sign-In Authentication.
* **Framer Motion:** Animations for page transitions.
* **Lucide React:** Accessible SVG icon library.
* **date-fns:** Date utility library.

## II. Routing and Layouts (Next.js App Router)

* File-based routing via `src/app/` directories.
* Shared UI logic in `layout.tsx` files.
* Route Groups (`(folderName)`) for grouping without changing URL paths.
* **Server Components** (default): server-rendered, efficient.
* **Client Components** (`'use client'`): opt-in, interactive UI.
* **Suspense**: Used for loading fallbacks during data fetches.

## III. State Management

* **Local State**: via `useState`, `useEffect` for UI elements.
* **localStorage**:

  * Stores user-specific data such as theme, API keys, history, and profile info.
  * Synchronized using `useEffect` on mount and user action.
* **Firebase Auth State**: Managed by Firebase SDK and observed using `onAuthStateChanged`.
* **URL State**: via `useSearchParams` and `useRouter` from `next/navigation`.
* **React Context**: Used primarily by ShadCN UI components internally.

## IV. Component Architecture

* Modular and reusable.
* Presentational vs. Container logic split.
* ShadCN UI: Foundation components, Client-based.
* Custom Components:

  * Interactive logic lives in Client Components.
  * Pure visual components can be Server Components.

## V. External API Interaction (LLMs)

* **SUPPORTED\_API\_PROVIDERS**: Defines each LLM provider.
* Includes:

  * `providerId`, `name`, `docsLink`, `defaultModel`
  * `buildRequestDetails()` and `parseResponse()` for custom handling.
* **fetchFromProvider**:

  * Prepares request, handles errors, parses response, tracks usage.
* **Search Strategies**: Handles modes like multi-source, conflict-checking, etc.

## VI. Data Persistence & Schemas

All stored in browser `localStorage`.

### Key Schemas:

#### `ApiKeyEntry`:

```ts
interface ApiKeyEntry {
  configId: string;
  providerId: string;
  name: string;
  apiKey: string;
  docsLink?: string;
  rank?: number;
  dailyQuota?: number;
  usageToday?: number;
  lastResetDate?: string;
  isDeletable: boolean;
  defaultModel?: string;
}
```

#### `Project`:

```ts
interface Project {
  id: string;
  name: string;
  isArchived: boolean;
}
```

#### `HistoryItem`:

```ts
interface HistoryItem {
  id: string;
  query: string;
  date: string;
  timestamp: number;
  type: string;
  notes?: string;
  isFavorite?: boolean;
  projectId: string;
  projectName: string;
  resultText?: string;
}
```

* Resilient error handling with `try-catch` for JSON parsing.
* Default values used when keys are missing or corrupted.

## VII. Styling & Theming

* **Tailwind CSS** for styling.
* **globals.css** defines custom properties for light/dark theming.
* **ShadCN components** styled with utility classes.
* **Fonts**: Configured in `tailwind.config.ts` and linked via `layout.tsx`.
* **Dynamic theming**:

  * Read from `localStorage`.
  * Applied by toggling `html` classes.
  * Reacts to system theme or manual changes via custom event.

## VIII. Authentication Flow

* **Firebase Initialization** in `firebase.ts`.
* **Login UI** via `AuthForm.tsx` with Google Sign-In and guest mode.
* **Sign-In Flow**:

  * Uses Firebase OAuth popup.
  * Navigates to `/home` on success.
* **Auth State Monitoring** in `AppHeader.tsx`.
* **Logout**: Currently via route change; can be improved with `auth.signOut()`.

## IX. Error Handling & User Feedback

* **Toasts**: For notifications (success, error, info).
* **Inline UI**:

  * Error states in components.
  * Loading indicators (`Loader2` icon, `LoadingFallback.tsx`).
  * Empty state messages for lists.
* **Logging**: via console for debugging.

## X. Environment Variables

* Stored in `.env` or `.env.local` (gitignored).
* All Firebase keys prefixed with `NEXT_PUBLIC_`.
* **Important**: LLM API keys are stored client-side via localStorage (no backend proxy).

## XI. Build & Deployment

* **Development**: `npm run dev` (Fast Refresh).
* **Build**: `npm run build` (bundles + optimization).
* **Deployment**:

  * Uses Firebase App Hosting.
  * CLI command: `firebase deploy --only hosting`

---

This architecture overview provides the foundation and technical reference for understanding, developing, and maintaining the **Vault of Seekers** application.
