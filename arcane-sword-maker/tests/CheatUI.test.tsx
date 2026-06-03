import { render, screen, fireEvent, act } from '@testing-library/react';
import CheatUI from '../src/components/CheatUI';

const mockIframe = {
  contentWindow: {
    postMessage: jest.fn(),
  },
};

describe('CheatUI', () => {
  beforeAll(() => {
    document.querySelector = jest.fn(() => mockIframe);
    window.addEventListener = jest.fn((type, handler) => {
      if (type === 'message') {
        setTimeout(() => {
          act(() => handler({ data: { type: 'progression-update', progression: { unlockedUnlocks: ['sell'] } }, source: mockIframe.contentWindow }));
        }, 10);
      }
    });
    window.removeEventListener = jest.fn();
  });

  it('renders Waiting for game state initially', () => {
    render(<CheatUI />);
    expect(screen.getByText(/Waiting for game state/i)).toBeInTheDocument();
  });

  it('updates progression state on progression-update', async () => {
    render(<CheatUI />);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.getByText(/Cheat UI/)).toBeInTheDocument();
    expect(screen.getByText(/Unlock next/)).toBeInTheDocument();
  });

  it('sends cheat-set-progression message on unlock', async () => {
    render(<CheatUI />);
    await new Promise(resolve => setTimeout(resolve, 20));
    fireEvent.click(screen.getByText(/Unlock next/));
    expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cheat-set-progression' }), '*'
    );
  });

  it('does not update progression if no progression-update received', async () => {
    window.addEventListener = jest.fn();
    render(<CheatUI />);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.getByText(/Waiting for game state/i)).toBeInTheDocument();
  });

  it('shows all unlocks granted when all unlocks are present', async () => {
    document.querySelector = jest.fn(() => mockIframe);
    window.addEventListener = jest.fn((type, handler) => {
      if (type === 'message') {
        setTimeout(() => {
          act(() => handler({ data: { type: 'progression-update', progression: { unlockedUnlocks: ['donate','sell','buy','auto-sell','auto-buy'] } }, source: mockIframe.contentWindow }));
        }, 10);
      }
    });
    render(<CheatUI />);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.getByText(/All unlocks granted!/)).toBeInTheDocument();
  });
});
