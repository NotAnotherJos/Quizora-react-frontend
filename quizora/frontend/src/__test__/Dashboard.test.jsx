import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/dashboard/index.jsx';
import { MemoryRouter } from 'react-router-dom';


describe('Dashboard Page', () => {
  test('renders Create Now button', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // check buttom
    const createButton = screen.getByText(/Create Now/i);
    expect(createButton).toBeInTheDocument();
  });

  test('opens modal when Create Now is clicked', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const createButton = screen.getByText(/Create Now/i);
    await userEvent.click(createButton);

    // check PlaceholderText
    const input = await screen.findByPlaceholderText(/Enter game name/i);
    expect(input).toBeInTheDocument();
  });
});
