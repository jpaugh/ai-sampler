import React from "react";
import Game from "./Game";

const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;

type Size = {
  width: number;
  height: number;
};

const GameWrapper: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState<Size>({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const scale = React.useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return 1;
    }

    return Math.min(containerSize.width / GAME_WIDTH, containerSize.height / GAME_HEIGHT);
  }, [containerSize.height, containerSize.width]);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="origin-center"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <Game />
      </div>
    </div>
  );
};

export default GameWrapper;
