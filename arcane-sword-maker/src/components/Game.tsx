import React from "react";
import Enchant from "./Enchant";
import Buy from "./Buy";
import Stats from "./Stats";
import Chances from "./Chances";
import { Intro } from "./Intro";
import StartMenu from "./StartMenu";
import { useSound } from "../hooks/useSound";
import { useAppDispatch, useAppSelector } from "../store/store";
import { markIntroFinished } from "../store/gameSlice";
import { setAmbienceAutoMuted } from "../store/settingsSlice";
import { audioThemeManager } from "../utils/audioTheme";
import CheatBridge from './CheatBridge';

const Game: React.FC = () => {
  const dispatch = useAppDispatch();
  const introFinished = useAppSelector((state) => state.game.introFinished);
  const isSfxMuted = useAppSelector((state) => state.settings.isSfxMuted);
  const isAmbienceMuted = useAppSelector((state) => state.settings.isAmbienceMuted);
  const unlockedUnlocks = useAppSelector((state) => state.game.progression.unlockedUnlocks);
  const totalGold = useAppSelector((state) => state.game.progression.stats.totalSoldValue);
  const [activeTab, setActiveTab] = React.useState<"enchant" | "buy" | "chances" | "stats">("enchant");
  const hasSellUnlocked = unlockedUnlocks.includes("sell");
  const hasBuyUnlocked = unlockedUnlocks.includes("buy");

  const hasSeenStartMenu = useAppSelector((state) => state.session.hasSeenStartMenu);
  const hasGame = useAppSelector((state) => state.game.hasGame);

  const handleNewGame = () => {
    dispatch({ type: "game/resetGame" });
    dispatch({ type: "session/setHasSeenStartMenu", payload: true });
  };

  const handleContinue = () => {
    dispatch({ type: "session/setHasSeenStartMenu", payload: true });
  };

  React.useEffect(() => {
    if (!introFinished) {
      setActiveTab("enchant");
    }
  }, [introFinished]);

  React.useEffect(() => {
    audioThemeManager.getSound('move-weapon');
  }, []);

  const { play: playAtmosphere, stop: stopAtmosphere } = useSound('atmosphere', {
    volume: .1,
    loop: true,
    channel: 'ambience',
  });

  React.useEffect(() => {
    if (isAmbienceMuted) {
      stopAtmosphere();
      return;
    }

    playAtmosphere();
  }, [isAmbienceMuted, playAtmosphere, stopAtmosphere]);

  React.useEffect(() => {
    const handleWindowBlur = () => {
      dispatch(setAmbienceAutoMuted(true));
    };

    const handleWindowFocus = () => {
      dispatch(setAmbienceAutoMuted(false));
    };

    const handleVisibilityChange = () => {
      dispatch(setAmbienceAutoMuted(document.hidden));
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    handleVisibilityChange();

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch]);

  const getTabClassName = (tab: "enchant" | "buy" | "chances" | "stats") =>
    `rounded-t-md border-x border-t border-slate-300 px-3 py-1.5 text-sm font-medium -mb-px ${
      activeTab === tab ? "bg-white text-slate-800" : "bg-slate-100 text-slate-600"
    }`;

  if (!hasSeenStartMenu) {
    return (
      <StartMenu
        hasGame={hasGame}
        onNewGame={handleNewGame}
        onContinue={handleContinue}
      />
    );
  }

  if (!introFinished) {
    return <Intro onComplete={() => dispatch(markIntroFinished())} />;
  }

  return (
    <div
      className="h-full w-full min-h-0 bg-slate-100 p-4 select-none"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="flex h-full w-full min-h-0 flex-col rounded-lg border border-slate-300 bg-white p-2">
        <div className="border-b border-slate-300 px-2 pt-1">
          <div role="tablist" aria-label="Game tabs" className="grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="flex items-end gap-2">
              <button
                type="button"
                role="tab"
                aria-controls="tab-panel-enchant"
                aria-selected={activeTab === "enchant"}
                onClick={() => setActiveTab("enchant")}
                className={getTabClassName("enchant")}
              >
                Enchant
              </button>
              {hasBuyUnlocked && (
                <button
                  type="button"
                  role="tab"
                  aria-controls="tab-panel-buy"
                  aria-selected={activeTab === "buy"}
                  onClick={() => setActiveTab("buy")}
                  className={getTabClassName("buy")}
                >
                  Buy
                </button>
              )}
              <button
                type="button"
                role="tab"
                aria-controls="tab-panel-stats"
                aria-selected={activeTab === "stats"}
                onClick={() => setActiveTab("stats")}
                className={getTabClassName("stats")}
              >
                Stats
              </button>
              <button
                type="button"
                role="tab"
                aria-controls="tab-panel-chances"
                aria-selected={activeTab === "chances"}
                onClick={() => setActiveTab("chances")}
                className={getTabClassName("chances")}
              >
                Chances
              </button>
            </div>
            <div className="mb-1 flex justify-self-end gap-1 items-center">
              {hasSellUnlocked && (
                <div className="text-xs font-semibold text-slate-700 mr-2" data-testid="gold-display">
                  Gold: {totalGold.toFixed(1)}
                </div>
              )}
              <button
                type="button"
                disabled
                className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs opacity-50 cursor-not-allowed"
                title="Sound effects are currently disabled"
              >
                SFX {isSfxMuted ? "🔇" : "🔊"}
              </button>
              <button
                type="button"
                disabled
                className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs opacity-50 cursor-not-allowed"
                title="Ambient audio is currently disabled"
              >
                Amb {isAmbienceMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 pt-2">
          <div role="tabpanel" id="tab-panel-enchant" hidden={activeTab !== "enchant"} className="h-full w-full">
            <Enchant onNavigateToBuy={() => setActiveTab("buy")} />
          </div>
          {hasBuyUnlocked && (
            <div role="tabpanel" id="tab-panel-buy" hidden={activeTab !== "buy"} className="h-full w-full">
              <Buy />
            </div>
          )}
          <div role="tabpanel" id="tab-panel-stats" hidden={activeTab !== "stats"} className="h-full w-full">
            <Stats />
          </div>
          <div role="tabpanel" id="tab-panel-chances" hidden={activeTab !== "chances"} className="h-full w-full">
            <Chances />
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameWithCheatBridge: React.FC = (props) => (
  <>
    {import.meta.env.DEV && <CheatBridge />}
    <Game {...props} />
  </>
);

export default Game;