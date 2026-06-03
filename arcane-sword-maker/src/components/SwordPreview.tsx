
import React from "react";
import { publicAssetUrl } from "../utils/audioTheme";

const SwordPreview: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={`flex flex-col items-center justify-start h-full min-h-0 gap-3 p-4 ${className ?? ""}`} aria-label="Sword preview">
      <img
        src={publicAssetUrl("assets/sword.svg")}
        alt="Sword weapon illustration"
        className="flex-1 min-h-0 w-full h-full object-contain"
        aria-label="Sword weapon"
      />
    </section>
  );
};

export default SwordPreview;
