import React from "react";
import { Check } from "lucide-react";

interface Props {
  isSelectionMode?: boolean;
  isSelected?: boolean;
  isOwn?: boolean;
}

const SelectionCheckbox: React.FC<Props> = ({ isSelectionMode, isSelected, isOwn }) => {
  if (!isSelectionMode) return null;
  return (
    <div className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isOwn ? 'ml-2 order-3' : 'mr-2'}`}>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-[#00d9ff] border-[#00d9ff] scale-110' : 'border-[#666] hover:border-[#00d9ff] hover:scale-105'}`}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </div>
  );
};

export default SelectionCheckbox;
