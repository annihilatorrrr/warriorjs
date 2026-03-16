import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import ErrorMessage from './ErrorMessage.js';

const delay = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('ErrorMessage', () => {
  test('renders error message in output', () => {
    const { lastFrame } = render(
      <ErrorMessage message="Something went wrong" onDismiss={vi.fn()} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Something went wrong');
    expect(output).toContain('Press any key to continue...');
  });

  test('calls onDismiss on any key press', () => {
    const onDismiss = vi.fn();
    const { stdin } = render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    stdin.write('x');
    expect(onDismiss).toHaveBeenCalled();
  });

  test('renders null after dismissal', async () => {
    const { stdin, lastFrame } = render(<ErrorMessage message="Error" onDismiss={vi.fn()} />);
    stdin.write('x');
    await delay();
    expect(lastFrame()!).toBe('');
  });

  test('ignores subsequent key presses', async () => {
    const onDismiss = vi.fn();
    const { stdin } = render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    stdin.write('x');
    await delay();
    stdin.write('y');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders without dismiss hint when onDismiss is not provided', () => {
    const { lastFrame } = render(<ErrorMessage message="Fatal error" />);
    const output = lastFrame()!;
    expect(output).toContain('Fatal error');
    expect(output).not.toContain('Press any key to continue...');
  });

  test('does not respond to key presses when onDismiss is not provided', async () => {
    const { stdin, lastFrame } = render(<ErrorMessage message="Fatal error" />);
    stdin.write('x');
    await delay();
    expect(lastFrame()!).toContain('Fatal error');
  });
});
