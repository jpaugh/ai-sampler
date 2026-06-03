
import React from "react";
import { publicAssetUrl } from "../utils/audioTheme";

const AxePreview: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={`flex flex-col items-center justify-start h-full min-h-0 gap-3 p-4 ${className ?? ""}`} aria-label="Axe preview">
      <img
        src={publicAssetUrl("assets/axe.svg")}
        alt="Axe weapon illustration"
        className="flex-1 min-h-0 w-full h-full object-contain"
        aria-label="Axe weapon"
      />
    </section>
  );
};

export default AxePreview;
