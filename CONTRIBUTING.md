# Contributing to LNC Admin Panel

Thank you for considering contributing to the LNC Admin Panel! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)
- **Error messages** or console logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide detailed description** of the suggested enhancement
- **Explain why** this enhancement would be useful
- **Include mockups or examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit the pull request**

## 🏗️ Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/lnc-adminPanel.git
   cd lnc-adminPanel
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   - Copy `.env.local` and fill in your values
   - See SETUP-GUIDE.md for details

4. **Start development server**
   ```bash
   pnpm dev
   ```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces
- Avoid `any` type when possible
- Use proper type imports

```typescript
// Good
interface User {
  id: number;
  email: string;
  name: string;
}

// Bad
const user: any = {...};
```

### React Components

- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use proper prop types

```tsx
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

### File Structure

```
components/
├── ui/              # Reusable UI components
├── dashboard/       # Feature-specific components
└── [Feature].tsx    # Main feature components

lib/
├── utils.ts         # General utilities
└── [feature]/       # Feature-specific utilities
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Keep responsive design in mind
- Use CSS variables for theming

```tsx
// Good
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <Card className="w-full md:w-1/2">...</Card>
</div>
```

### State Management

- Use React hooks for local state
- Keep state as close to where it's used as possible
- Use proper dependency arrays in useEffect
- Consider context for shared state

### API Routes

- Follow RESTful conventions
- Validate input data
- Return appropriate status codes
- Handle errors properly

```typescript
// Good
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process request...
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing

Before submitting:

1. **Test all functionality** manually
2. **Check responsive design** on different screen sizes
3. **Test in multiple browsers** (Chrome, Firefox, Safari)
4. **Verify dark/light modes** work correctly
5. **Check console** for errors or warnings

## 📦 Commit Messages

Use clear and meaningful commit messages:

```bash
# Good
git commit -m "Add user deletion feature to settings page"
git commit -m "Fix responsive layout issue on mobile dashboard"
git commit -m "Update README with new setup instructions"

# Bad
git commit -m "fixes"
git commit -m "update"
git commit -m "wip"
```

### Commit Message Format

```
<type>: <subject>

<body (optional)>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🔍 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose:

1. Reviewer will check code quality and functionality
2. Reviewer may request changes
3. Once approved, code will be merged
4. Keep PR scope focused and manageable

## 🐛 Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🎯 Priority Areas

Areas where contributions are especially welcome:

1. **Security Enhancements**

   - Password hashing implementation
   - Input validation
   - SQL injection prevention

2. **Testing**

   - Unit tests
   - Integration tests
   - E2E tests

3. **Documentation**

   - API documentation
   - Component documentation
   - Tutorial videos

4. **Features**

   - Two-factor authentication
   - Advanced analytics
   - Export/import functionality
   - Email notifications

5. **Performance**
   - Code optimization
   - Bundle size reduction
   - Loading time improvements

## 💬 Questions?

Feel free to:

- Open an issue for discussion
- Email: jit.nathdeb@gmail.com
- Check existing issues and discussions

## 📜 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to LNC Admin Panel! 🚀
