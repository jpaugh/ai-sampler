import React from "react";
import { useAppDispatch } from "../store/store";
import { setHasSeenStartMenu } from "../store/sessionSlice";

interface StartMenuProps {
  hasGame: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ hasGame, onNewGame, onContinue }) => {
  const dispatch = useAppDispatch();
  const handleNewGame = () => {
    dispatch(setHasSeenStartMenu(true));
    onNewGame();
  };

  const handleContinue = () => {
    dispatch(setHasSeenStartMenu(true));
    onContinue();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 bg-opacity-80 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Arcane Sword Maker</h1>
        <div className="flex flex-col gap-4 mb-6">
          <button className="px-6 py-2 bg-slate-700 text-white rounded-md text-lg font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400" onClick={handleNewGame}>
            New Game
          </button>
          {hasGame && (
            <button className="px-6 py-2 bg-slate-600 text-white rounded-md text-lg font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" onClick={handleContinue}>
              Continue
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <a href="https://www.youtube.com/@creativecraving" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-sm">
            Developed by @creativecraving
          </a>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScoyexiTzij9pF1DXWmeu_NNP2G1Ul83QLq5lgdXHUIONyzmQ/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-sm">
            Join the mailing list
          </a>
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
