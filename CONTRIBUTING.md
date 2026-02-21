# Contributing to appwrite-keepalive

Thanks for your interest in contributing.

## How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Make** your changes
4. **Test** your changes locally
5. **Commit** with a clear message
6. **Push** to your fork
7. **Open** a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/appwrite-keepalive.git
cd appwrite-keepalive

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your Appwrite credentials
# Then run setup
bun run setup

# Test the keepalive
bun run keepalive
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check code
bun run lint

# Format code
bun run format
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if needed
- Test your changes before submitting

## Questions?

Open an issue if you have questions or need help.
