# Contributing to PrayPal

Thank you for your interest in contributing to PrayPal!  
Our mission is to empower church communities to connect, support each other, and grow together through open-source technology.

We welcome contributions of all kinds—code, documentation, design, and ideas.  
Let’s build something meaningful, together.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Quality Control Checklist](#quality-control-checklist)
- [Pull Request Process](#pull-request-process)
- [Community & Support](#community--support)
- [License](#license)

---

## Code of Conduct

As contributors and maintainers of PrayPal, and in the interest of fostering an open, welcoming, and Christ-like community, we pledge to respect all people who contribute through reporting issues, posting feature requests, updating documentation, submitting pull requests, or any other activity.

**We are committed to making participation in this project a harassment-free experience for everyone, regardless of:**
- Age
- Visible or invisible disability
- Ethnicity
- Faith tradition or denomination
- Level of experience
- Nationality
- Personal appearance
- Race
- ETC. What would Jesus do?

**Examples of behavior that contributes to creating a positive environment include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy and kindness toward other community members

**Examples of unacceptable behavior by participants include:**
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others’ private information, such as a physical or electronic address, without explicit permission
- Other conduct which could reasonably be considered inappropriate in a church or Christian community setting

**Enforcement:**  
Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

**Reporting Issues:**  
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at [alexwhb]. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident.

---

## How Can I Contribute?

- **Bug Reports**: Report issues or suggest features via [GitHub Issues](../../issues).
- **Code**: Fix bugs, add features, or improve performance.
- **Documentation**: Improve guides, tutorials, or translations.
- **Design**: UI/UX improvements, icons, or branding.

---

## Getting Started

1. **Fork** the repository and clone your fork:
    ```bash
    git clone https://github.com/alexwhb/praypal.git
    cd praypal
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up environment variables**:  
   Copy `.env.example` to `.env` and adjust as needed.

4. **Run the app locally**:
    ```bash
    npm run dev
    ```

---

## Development Workflow

- Create a new branch for your work:
    ```bash
    git checkout -b feature/your-feature-name
    ```
- Make your changes.
- Run the linter before committing:
    ```bash
    npm run lint
    ```
- Commit with a clear message:
    ```bash
    git commit -m "feat: add group messaging feature"
    ```
- Push to your fork and open a Pull Request.

---

## Coding Guidelines

- **Language**: TypeScript (strict mode).
- **Framework**: [Remix](https://remix.run/) (Epic Stack).
- **Style**: Follow [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) rules.
- **Components**: Use functional components and hooks.
- **Accessibility**: Strive for accessible UI.
- **Documentation**: Update or add relevant docs for your changes.

---

## Quality Control Checklist

Before submitting your code, please ensure you have:

- **Manually tested** your changes in the browser and verified all affected features work as expected.
- **Checked for errors** in the browser console and server logs.
- **Reviewed your code** for clarity, readability, and maintainability.
- **Ensured code style** matches the project’s Prettier and ESLint rules.
- **Updated documentation** if your changes affect usage or setup.
- **Considered accessibility** and user experience for all users.
- **Double-checked** that you are not introducing sensitive data or credentials.

Taking time for thorough QC helps us keep PrayPal reliable and welcoming for all.

---

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Open a Pull Request with a clear description of your changes.
3. Reference related issues (e.g., `Closes #42`).
4. The maintainers will review your PR and may request changes.
5. Once approved, your PR will be merged!

---

## Community & Support

- Join our [Discussions](../../discussions) for questions, ideas, or prayer requests.
- Be respectful, encouraging, and Christ-like in all interactions.

---

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE).

---

Thank you for helping us serve the Church through open source!  
God bless you!
