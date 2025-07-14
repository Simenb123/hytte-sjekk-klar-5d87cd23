import { render, screen } from '@testing-library/react';
import ChecklistItem from './ChecklistItem';
import { describe, it, expect } from 'vitest';

describe('ChecklistItem', () => {
  it('renders image when imageUrl is provided', () => {
    render(
      <ChecklistItem id="1" text="Test" isCompleted={false} imageUrl="http://example.com/img.jpg" onToggle={() => {}} />
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'http://example.com/img.jpg');
  });

  it('does not render image when imageUrl is missing', () => {
    render(<ChecklistItem id="2" text="No Image" isCompleted={false} onToggle={() => {}} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
