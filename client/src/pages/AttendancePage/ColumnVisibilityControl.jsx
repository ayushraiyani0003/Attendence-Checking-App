import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";
import "./ColumnVisibilityControl.css";

const ColumnVisibilityControl = ({ columns, onToggleColumn }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition">
          Columns <ChevronDown size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white shadow-lg border border-gray-200 rounded-md p-4 w-56 z-50 animate-fade-in"
          sideOffset={5}
        >
          <div className="font-medium text-gray-700 border-b pb-2 mb-2">Manage Columns</div>
          <div className="max-h-60 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={column.isVisible}
                  onChange={() => onToggleColumn(column.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-gray-800">{column.label}</span>
              </label>
            ))}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default ColumnVisibilityControl;
