import React from "react";
import { resetGame } from "../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import { clearHasSeenStartMenu } from "../store/sessionSlice";

const formatLabel = (value: string): string =>
  value
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

type CounterMapProps = {
  title: string;
  values: Record<string, number | undefined>;
};

const CounterMap: React.FC<CounterMapProps> = ({ title, values }) => {
  const entries = Object.entries(values)
    .map(([key, count]) => ({ key, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No entries yet</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center justify-between text-xs text-slate-700">
              <span>{formatLabel(entry.key)}</span>
              <span className="font-semibold text-slate-900">{entry.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const Stats: React.FC = () => {
  const dispatch = useAppDispatch();
  const progression = useAppSelector((state) => state.game.progression);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleConfirmReset = () => {
    dispatch(resetGame());
    setShowConfirmModal(false);
  } 

  const handleStartMenu = () => {
    dispatch(clearHasSeenStartMenu());
  } 

  return (
    <div className="h-full w-full overflow-hidden bg-slate-100 p-4">
      <div className="h-full min-h-0 overflow-y-auto rounded-lg border border-slate-300 bg-slate-50 p-3">
        <section className="rounded-lg border border-slate-300 bg-white p-3">
          <h2 className="text-base font-semibold text-slate-800">Overview</h2>
          <p className="mt-2 text-sm text-slate-700">
            Total enchanted weapons: <span className="font-semibold text-slate-900">{progression.stats.totalEnchanted}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Total sold value: <span className="font-semibold text-slate-900">{progression.stats.totalSoldValue.toFixed(1)}</span>
          </p>
        </section>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <CounterMap title="By Class" values={progression.stats.byClass} />
          <CounterMap title="By Material" values={progression.stats.byMaterial} />
          <CounterMap title="By Quality" values={progression.stats.byQuality} />
        </div>

        <section className="mt-3 rounded-lg border border-slate-300 bg-white p-3">
          <h2 className="text-base font-semibold text-slate-800">Longest Name Records</h2>
          {progression.longestNameRecords.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No records yet</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {progression.longestNameRecords.map((record, index) => (
                <li key={`${record.achievedAt}-${record.name}`} className="rounded border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>#{index + 1}</span>
                    <span>{formatDateTime(record.achievedAt)}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{record.name}</div>
                  <div className="mt-1 text-xs text-slate-700">
                    Length: {record.length} | Weapon #{record.weaponsEnchanted}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            onClick={handleStartMenu}
          >
            Start Menu
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            onClick={() => setShowConfirmModal(true)}
          >
            Reset game
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Are you sure?</h2>
            <p className="mt-2 text-sm text-slate-700">
              This will reset all your stats and enchant progress. Audio settings will not be affected.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
                onClick={handleConfirmReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-600 px-4 py-2 ml-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                onClick={handleStartMenu}
              >
                Start Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;