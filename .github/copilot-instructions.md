- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [ ] Launch the Project
- [x] Ensure Documentation is Complete

Project notes:
- The workspace folder name includes uppercase letters, so `create-next-app` could not scaffold in-place. The project was scaffolded manually with a lowercase npm package name instead.
- The current implementation includes the Next.js App Router foundation, Supabase auth helpers, protected dashboard routes, batch upload flow, queue-oriented run endpoints, download routes, and the initial Supabase migration.
- The development task is available through `.vscode/tasks.json` and is currently serving the app on `http://localhost:3001` because port 3000 was already in use.
- No extra VS Code extensions were required by the project setup metadata.
- Debug launch has not been configured or started yet.
