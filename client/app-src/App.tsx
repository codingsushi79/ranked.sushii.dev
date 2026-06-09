import { RankedPanel } from "./components/RankedPanel";
import { TitleBar } from "./components/TitleBar";

export default function App() {
  return (
    <div className="app-shell app-shell-main">
      <TitleBar />
      <RankedPanel />
    </div>
  );
}
