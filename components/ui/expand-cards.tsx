"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

const images = [
  "https://pbs.twimg.com/media/G6dpB9JaAAA2wDS?format=png&name=360x360",
  "https://pbs.twimg.com/media/G6dpEiebIAEHrOS?format=jpg&name=360x360",
  "https://pbs.twimg.com/media/G6dpGJZbsAEg1tp?format=png&name=360x360",
  "https://pbs.twimg.com/media/G6dpHzVbkAERJI3?format=png&name=360x360",
  "https://pbs.twimg.com/media/G6dpKpcbgAAj7ce?format=png&name=360x360",
  "https://pbs.twimg.com/media/G6dpNYzawAAniIt?format=png&name=360x360",
  "https://pbs.twimg.com/media/G6dpPilbcAAH3jU?format=jpg&name=360x360",
  "https://pbs.twimg.com/media/G6dpRFBbsAEvquO?format=jpg&name=360x360",
  "https://pbs.twimg.com/media/G6dpUL-aUAAUqGZ?format=png&name=small",
];

interface ExpandOnHoverProps {
  onSelect?: (url: string) => void;
  selectedUrl?: string;
}

const ExpandOnHover: React.FC<ExpandOnHoverProps> = ({ onSelect, selectedUrl }) => {
  const [expandedImage, setExpandedImage] = useState<number | null>(null);

  // Adjusted widths for modal/popover context (container is max 320px)
  const getImageWidth = (index: number) =>
    index === expandedImage ? "100px" : "36px";

  return (
    <div className="w-full py-2">
      <div
        className="flex w-full items-center justify-start gap-2 overflow-x-auto p-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        <div className="flex gap-2 no-scrollbar">
          {images.map((src, idx) => {
            const isSelected = selectedUrl === src;
            return (
              <div
                key={idx}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-in-out border-2 flex-shrink-0",
                  isSelected ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-transparent"
                )}
                style={{
                  width: getImageWidth(idx),
                  height: "80px",
                }}
                onMouseEnter={() => setExpandedImage(idx)}
                onMouseLeave={() => setExpandedImage(null)}
                onClick={() => onSelect && onSelect(src)}
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  src={src}
                  alt={`Avatar Option ${idx + 1}`}
                  loading="lazy"
                />

                {/* Overlay Checkmark for selected item */}
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                    <div className="bg-indigo-500 rounded-full p-1 shadow-lg">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-white/40 mt-3">Hover to expand • Click to select</p>
    </div>
  );
};

export default ExpandOnHover;
