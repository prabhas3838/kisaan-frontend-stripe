# 🏗️ DevOps Infrastructure - Kisaan Saathi (DEV BRANCH)

As the DevOps Engineer for this project, I have implemented a professional CI/CD pipeline focused entirely on our **dev branch**.

## 🚀 CI/CD Pipeline
The pipeline is located in `.github/workflows/ci.yml` and triggers on every push to **dev**.

1.  **Static Analysis:** Automatically runs `npm run lint` to catch syntax and style errors.
2.  **Unit Testing:** Automatically runs `npm test` via Jest to ensure no features are broken.
3.  **Web Export:** Verifies that the project can be successfully built for production.
4.  **Automated Deployment:** Pushes to the **dev** branch automatically update the Live Preview on GitHub Pages.

## 🛠️ Developer Setup
To stay in sync with the DevOps standards, please follow these steps:
1.  **Code Style:** Ensure you have the "EditorConfig" extension installed in VS Code.
2.  **Pre-check:** Run `npm run lint` before you push your code.
3.  **Tests:** Run `npm test` to verify your changes locally.

## 📡 Deployment Status
- **Dev Branch:** Deploys automatically to GitHub Pages. All work happens here!

// Automated Pipeline Verified: Feb 24, 2026