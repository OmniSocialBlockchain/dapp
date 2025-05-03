# Contributing to OmniSocial Blockchain

Thank you for your interest in contributing to OmniSocial Blockchain! This document provides guidelines and instructions for contributing to our project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the [Issues](https://github.com/OmniSocialBlockchain/dapp/issues) section.
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Check if the feature has already been suggested in the [Issues](https://github.com/OmniSocialBlockchain/dapp/issues) section.
2. If not, create a new issue with:
   - A clear, descriptive title
   - Detailed description of the feature
   - Use cases and benefits
   - Any relevant mockups or designs

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Start the development server:
```bash
npm run dev
```

### Code Style

- Follow the [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- Use Prettier for code formatting
- Follow the existing code structure and patterns
- Write meaningful commit messages
- Include tests for new features

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Update tests when modifying existing features

### Documentation

- Update README.md if necessary
- Add comments for complex logic
- Document new features and changes

## Getting Help

- Join our [Discord](https://discord.gg/omnisocial)
- Check our [documentation](https://docs.omnisocial.dev)
- Open an issue for questions

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE). 