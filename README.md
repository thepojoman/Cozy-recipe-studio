# Cozy Recipe Studio

A polished recipe web app built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. It lets a user save recipes, create from scratch, parse pasted text, mock-parse uploaded screenshots, track dish photos, cook with checklists and timers, scale portions, and manage cozy theme tags.

## Features

- Recipe library with cards, cover photos, search, and tag filters
- Manual recipe creation and editing
- Paste parser for title, description, servings, times, ingredients, instructions, timers, equipment, and tags
- Mock OCR parser for screenshot/photo uploads
- Recipe detail page with estimated time, actual time, notes, gallery, cover selection, edit, and delete
- Cooking mode with servings scaling, ingredient checklist, equipment checklist, instruction checklist, detected timers, and manual timer
- Supabase-ready relational schema and Storage bucket for recipe photos
- Local mock mode when Supabase env vars are not configured
- Hidden dachshund Easter egg via the logo

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works without Supabase credentials by using seed data and `localStorage`.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_RECIPE_PHOTO_BUCKET=recipe-photos
```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Confirm the `recipe-photos` Storage bucket exists and is public.
5. Add the environment variables above to `.env.local`.

The included policies are permissive for an MVP without authentication. For production, add Supabase Auth and replace the public policies with user-scoped policies.

## Parser/OCR Upgrade Path

The parsing surface lives in `src/lib/parser.ts`.

- `parseRecipeText` handles pasted recipe text now.
- `mockOcrRecipe` is the placeholder for image OCR.
- Replace `mockOcrRecipe` with an OCR or AI extraction call when API keys are available.
- Keep the return type as `RecipeDraft` so the UI does not need to change.

## Deployment on Vercel

1. Push the project to a Git repository.
2. Import the repository in Vercel.
3. Add the Supabase environment variables in Vercel Project Settings.
4. Deploy.

Recommended build settings:

```bash
npm run build
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```
