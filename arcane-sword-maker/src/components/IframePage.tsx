import React from "react";
import CheatUI from './CheatUI';

const IframePage: React.FC = () => {
  const [width, setWidth] = React.useState(640);
  const [height, setHeight] = React.useState(360);

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2">
          Width:
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="border px-2 py-1 w-24"
          />
        </label>
        <label className="flex items-center gap-2">
          Height:
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="border px-2 py-1 w-24"
          />
        </label>
      </div>
      <iframe
        src="?embed=true"
        width={width}
        height={height}
        className="border-2 border-gray-400"
        title="Game Preview"
      />
      <CheatUI />
      </div>
  );
};

export default IframePage;
