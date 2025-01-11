# Contributing to Curiso.ai

Thank you for considering contributing to Curiso.ai! We welcome contributions from the community to help improve and enhance the project. Please take a moment to review these guidelines before you start contributing.

## Setting Up the Development Environment

To set up the development environment for Curiso.ai, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/metaspartan/curiso.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd curiso
   ```

3. **Install dependencies:**

   ```bash
   cargo install tauri-cli
   bun install
   ```

4. **Run the development build:**

   ```bash
   bun run desktop
   ```

## Coding Standards and Guidelines

To maintain consistency and readability in the codebase, please adhere to the following coding standards and guidelines:

- Follow the existing code style and conventions.
- Write clear and concise comments where necessary.
- Ensure your code is well-documented.
- Write tests for new features and bug fixes.
- Use meaningful commit messages.

## Submitting Pull Requests

When submitting a pull request, please follow these guidelines:

1. **Fork the repository:**

   Click the "Fork" button at the top right corner of the repository page.

2. **Create a new branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**

   Implement your changes and commit them with meaningful commit messages.

4. **Push your changes:**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a pull request:**

   Go to the repository page on GitHub and click the "New pull request" button. Provide a clear description of your changes and any relevant information.

## Branching Strategy

We use the following branching strategy for development and production:

- **dev branch:** This branch is used for development. All new features and bug fixes should be merged into this branch.
- **main branch:** This branch is used for production. Only stable and tested code should be merged into this branch.

## Code of Conduct

We expect all contributors to adhere to our Code of Conduct. Please read and follow the [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive environment for everyone.
