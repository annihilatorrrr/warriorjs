import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import ConfirmPrompt from './ConfirmPrompt.js';

const delay = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('ConfirmPrompt', () => {
  test('renders message with y/N hint by default', () => {
    const { lastFrame } = render(<ConfirmPrompt message="Continue?" onConfirm={vi.fn()} />);
    const output = lastFrame()!;
    expect(output).toContain('Continue?');
    expect(output).toContain('(y/N)');
  });

  test('shows Y/n hint when defaultValue is true', () => {
    const { lastFrame } = render(
      <ConfirmPrompt message="Continue?" defaultValue={true} onConfirm={vi.fn()} />,
    );
    expect(lastFrame()!).toContain('(Y/n)');
  });

  test('confirms with true on y', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(<ConfirmPrompt message="Continue?" onConfirm={onConfirm} />);
    stdin.write('y');
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  test('confirms with false on n', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(<ConfirmPrompt message="Continue?" onConfirm={onConfirm} />);
    stdin.write('n');
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  test('uses default value on enter', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmPrompt message="Continue?" defaultValue={true} onConfirm={onConfirm} />,
    );
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  test('shows Yes in submitted state', async () => {
    const { stdin, lastFrame } = render(<ConfirmPrompt message="Continue?" onConfirm={vi.fn()} />);
    stdin.write('y');
    await delay();
    const output = lastFrame()!;
    expect(output).toContain('Continue?');
    expect(output).toContain('Yes');
  });

  test('shows No in submitted state', async () => {
    const { stdin, lastFrame } = render(<ConfirmPrompt message="Continue?" onConfirm={vi.fn()} />);
    stdin.write('n');
    await delay();
    const output = lastFrame()!;
    expect(output).toContain('No');
  });

  test('ignores input after submission', async () => {
    const onConfirm = vi.fn();
    const { stdin } = render(<ConfirmPrompt message="Continue?" onConfirm={onConfirm} />);
    stdin.write('y');
    await delay();
    stdin.write('n');
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
