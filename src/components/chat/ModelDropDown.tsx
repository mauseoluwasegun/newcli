"use client";

/** === LUCIDE REACT — ChevronUpIcon for the dropdown trigger arrow === */
import { ChevronUpIcon } from "lucide-react";

/**
 * === RADIX UI DROPDOWN MENU ("@radix-ui/react-dropdown-menu") ===
 * Accessible, unstyled dropdown menu component.
 * - DropdownMenuTrigger: The button that opens the menu.
 * - DropdownMenuContent: The floating panel with menu items.
 * - DropdownMenuItem: Individual selectable options.
 * Used here for the AI model selector — lets users pick which model to chat with.
 * World use cases: Navigation menus, context menus, settings, any selectable list.
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/** === Local button component === */
import { Button } from "../ui/button";

/** === React — startTransition for non-blocking cookie saves === */
import { startTransition } from "react";

/**
 * === MODEL REGISTRY (local) ===
 * Contains all available AI models with their logos, names, and provider config.
 * Each entry uses @lobehub/icons for the model's brand logo (Google, Meta, OpenAI, etc.).
 */
import { MODEL_REGISTRY, type ModelId } from "@/lib/model/model";

/** === Local cookie persistence for model selection === */
import { saveChatModelAsCookie } from "@/lib/model";

/** === Local tool type === */
import { Tool } from "@/lib/tools/tool";

interface ModelDropDownProps {
  optimisticModel: ModelId;
  setOptimisticModel: (model: ModelId) => void;
  currentTool: Tool;
  disabled?: boolean;
}

const ModelDropDown = ({
  optimisticModel,
  setOptimisticModel,
  disabled = false,
  currentTool,
}: ModelDropDownProps) => {
  const handleModelChange = (modelId: ModelId) => {
    if (disabled) return;
    setOptimisticModel(modelId);
    startTransition(async () => {
      await saveChatModelAsCookie(modelId);
    });
  };

  const currentModel = MODEL_REGISTRY[optimisticModel];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="text-sm">
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-lg max-md:text-xs ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={disabled}
        >
          {currentModel.name}
          <ChevronUpIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg px-2 pt-2.5 border border-muted-foreground/10"
        side="top"
        align="start"
        sideOffset={4}
      >
        {Object.entries(MODEL_REGISTRY).map(([modelId, config]) => (
          <DropdownMenuItem
            key={modelId}
            className={`mb-2 max-md:text-xs cursor-pointer ${
              modelId === optimisticModel ? "bg-muted font-semibold" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && handleModelChange(modelId as ModelId)}
            disabled={
              disabled ||
              (modelId === "qwen/qwen3-32b" && currentTool !== "reasoning")
            }
          >
            <div className="flex items-center gap-1.5">
              {<config.logo className="size-4" />}
              <span className="max-sm:text-xs">{config.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelDropDown;
