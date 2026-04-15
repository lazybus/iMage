# iMage

Next.js + Supabase application for batch image editing workflows.

## Current status

This repository now includes the foundation for:

- Supabase auth with email/password, magic link, and Google OAuth hooks
- Protected dashboard routes for batch management
- Batch creation with multi-image upload and per-image prompts
- Queue-oriented processing run records for single-image or full-batch execution
- Private download routes for individual results or a batch zip file
- Supabase SQL migration files and a worker stub for Nano Banana integration

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase and Nano Banana credentials.
	Use Supabase's new key model: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser/server session clients and `SUPABASE_SECRET_KEY` for privileged server access.
	Set `SUPABASE_STORAGE_BUCKET` to the shared private bucket name used for originals and processed outputs. The app isolates users by storage path prefix and RLS policy, not by per-user bucket names.
2. Create a Supabase project and run the SQL in `supabase/migrations/20260414_initial_schema.sql`.
3. Create one private storage bucket matching `SUPABASE_STORAGE_BUCKET` if you are not relying on the migration to create the default `image-documents` bucket.
4. Run `npm run dev`.

## Google AI Studio model setup

- Put your Google AI Studio API key in `NANO_BANANA_API_KEY`.
- Leave `NANO_BANANA_API_URL` at `https://generativelanguage.googleapis.com/v1beta/models` unless you need to target a different Google API host.
- Use `NANO_BANANA_MODEL=gemini-2.5-flash-image-preview` for the Nano Banana style Gemini image-editing flow.
- A direct server test endpoint is available at `POST /api/model/nano-banana/edit` with form data fields `prompt` and `imageFile`.

## Next implementation slices

- Wire the background worker to the actual Nano Banana provider endpoint.
- Add retry controls and richer progress refresh with Supabase Realtime.
- Add direct output upscaling execution once the provider contract is finalized.
