import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, FullScreenLoader, InlineLoader } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('w-4 h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('w-8 h-8');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('text-primary-600');

    rerender(<LoadingSpinner color="white" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('text-white');
  });
});

describe('FullScreenLoader', () => {
  it('renders full screen loader', () => {
    render(<FullScreenLoader text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...').closest('div')).toHaveClass('fixed inset-0');
  });
});

describe('InlineLoader', () => {
  it('renders inline loader', () => {
    render(<InlineLoader text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...').closest('div')).toHaveClass('flex items-center justify-center py-8');
  });
});

