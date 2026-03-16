import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import TextPrompt from './TextPrompt.js';

const delay = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('TextPrompt', () => {
  test('renders message', () => {
    const { lastFrame } = render(<TextPrompt message="Enter name:" onSubmit={vi.fn()} />);
    expect(lastFrame()!).toContain('Enter name:');
  });

  test('shows default value as hint', () => {
    const { lastFrame } = render(
      <TextPrompt message="Name:" defaultValue="Olric" onSubmit={vi.fn()} />,
    );
    expect(lastFrame()!).toContain('(Olric)');
  });

  test('submits typed value on enter', async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextPrompt message="Name:" onSubmit={onSubmit} />);
    stdin.write('Corwin');
    await delay();
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith('Corwin');
  });

  test('submits default value when empty', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <TextPrompt message="Name:" defaultValue="Olric" onSubmit={onSubmit} />,
    );
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith('Olric');
  });

  test('backspace removes last character', async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextPrompt message="Name:" onSubmit={onSubmit} />);
    stdin.write('abc');
    await delay();
    stdin.write('\x7F'); // backspace
    await delay();
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith('ab');
  });

  test('shows submitted state', async () => {
    const { stdin, lastFrame } = render(<TextPrompt message="Name:" onSubmit={vi.fn()} />);
    stdin.write('Corwin');
    await delay();
    stdin.write('\r');
    await delay();
    const output = lastFrame()!;
    expect(output).toContain('Name:');
    expect(output).toContain('Corwin');
  });

  test('calls onCancel on escape', async () => {
    const onCancel = vi.fn();
    const { stdin } = render(<TextPrompt message="Name:" onSubmit={vi.fn()} onCancel={onCancel} />);
    stdin.write('\x1B');
    await delay();
    expect(onCancel).toHaveBeenCalled();
  });

  test('ignores input after submission', async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextPrompt message="Name:" onSubmit={onSubmit} />);
    stdin.write('a');
    await delay();
    stdin.write('\r');
    await delay();
    stdin.write('b');
    await delay();
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('uses initialValue as starting text', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextPrompt message="Name:" initialValue="pre" onSubmit={onSubmit} />);
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith('pre');
  });
});
