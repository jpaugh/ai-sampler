import GameWrapper from "./components/GameWrapper";
import IframePage from "./components/IframePage";

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("embed")) {
    return <GameWrapper />;
  }

  if (import.meta.env.DEV) {
    return <IframePage />;
  }

  return <GameWrapper />;
};

export default App
