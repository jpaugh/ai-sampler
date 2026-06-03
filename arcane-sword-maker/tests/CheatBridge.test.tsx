import { render, fireEvent, act } from '@testing-library/react';
import CheatBridge from '../src/components/CheatBridge';
import { Provider } from 'react-redux';
import { configureStore } from 'redux-mock-store';

const mockStore = configureStore([]);

beforeAll(() => {
  window.parent.postMessage = jest.fn();
});

describe('CheatBridge', () => {
  it('responds to cheat-request-progression', () => {
    const store = mockStore({ game: { progression: { unlockedUnlocks: ['sell'], stats: {} } } });
    render(
      <Provider store={store}>
        <CheatBridge />
      </Provider>
    );
    act(() => {
      fireEvent(window, new MessageEvent('message', { data: { type: 'cheat-request-progression' } }));
    });
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'progression-update' }), '*'
    );
  });

  it('dispatches setProgression on cheat-set-progression', () => {
    const store = mockStore({ game: { progression: { unlockedUnlocks: [], stats: {} } } });
    store.dispatch = jest.fn();
    render(
      <Provider store={store}>
        <CheatBridge />
      </Provider>
    );
    act(() => {
      fireEvent(window, new MessageEvent('message', { data: { type: 'cheat-set-progression', progression: { unlockedUnlocks: ['buy'] } } }));
    });
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'game/setProgression', payload: { unlockedUnlocks: ['buy'] } });
  });
});
