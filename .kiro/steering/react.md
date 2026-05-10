# React Conventions

## React 19+

This project uses React 19. Follow React 19 patterns throughout.

### No `forwardRef`

React 19 passes `ref` as a regular prop, so `React.forwardRef` is no longer needed and should not be used.

```typescript
// ✅ Correct — React 19
export function Button({ className, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return <button className={className} {...props} />;
}

// ❌ Incorrect — legacy pattern
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />
);
```

### No `displayName`

`displayName` was primarily needed to give forwardRef-wrapped components a readable name in DevTools. Since we no longer use `forwardRef`, named function declarations and named function expressions provide the display name automatically.

```typescript
// ✅ Correct — name comes from the function
export function Label({ ... }: LabelProps) { ... }

// ❌ Incorrect — unnecessary with named functions
Label.displayName = "Label";
```
