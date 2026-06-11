import { render, screen } from '@testing-library/react';

function Test() {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>This is a test page.</p>
    </div>
  );
}

test('renders the test page content', () => {
  render(<Test />);

  expect(screen.getByRole('heading', { name: 'Hello, World!' })).toBeInTheDocument();
  expect(screen.getByText('This is a test page.')).toBeInTheDocument();
});
