import {
  INSERT_DIVIDER_COMMAND_NAME,
  SET_CODE_BLOCK_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  TOGGLE_BULLET_LIST_COMMAND_NAME,
  TOGGLE_ORDERED_LIST_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  TOGGLE_TASK_LIST_COMMAND_NAME,
} from "@crucialy-rich/core";

import { defineSlashCommandItems } from "./config";
import type { SlashCommandItem } from "./types";

export function createDefaultSlashCommandItems(): SlashCommandItem[] {
  return defineSlashCommandItems([
    {
      commandName: SET_HEADING_COMMAND_NAME,
      description: "切换为普通正文段落",
      id: "paragraph",
      keywords: ["正文", "段落", "text"],
      label: "正文",
      payload: { level: null },
    },
    ...([1, 2, 3] as const).map((level) => ({
      commandName: SET_HEADING_COMMAND_NAME,
      description: `切换为 ${level} 级标题`,
      id: `heading-${level}`,
      keywords: [`标题${level}`, `h${level}`, "heading"],
      label: `${level} 级标题`,
      payload: { level },
    })),
    {
      commandName: TOGGLE_QUOTE_COMMAND_NAME,
      description: "切换为引用块",
      id: "quote",
      keywords: ["引用", "blockquote"],
      label: "引用",
    },
    {
      commandName: SET_CODE_BLOCK_COMMAND_NAME,
      description: "切换为代码块",
      id: "code-block",
      keywords: ["代码", "code"],
      label: "代码块",
      payload: { enabled: true },
    },
    {
      commandName: TOGGLE_BULLET_LIST_COMMAND_NAME,
      description: "切换为无序列表",
      id: "bullet-list",
      keywords: ["无序列表", "项目符号", "ul"],
      label: "无序列表",
    },
    {
      commandName: TOGGLE_ORDERED_LIST_COMMAND_NAME,
      description: "切换为有序列表",
      id: "ordered-list",
      keywords: ["有序列表", "编号", "ol"],
      label: "有序列表",
    },
    {
      commandName: TOGGLE_TASK_LIST_COMMAND_NAME,
      description: "切换为任务列表",
      id: "task-list",
      keywords: ["任务列表", "待办", "todo"],
      label: "任务列表",
    },
    {
      commandName: INSERT_DIVIDER_COMMAND_NAME,
      description: "插入一条分割线",
      id: "divider",
      keywords: ["分割线", "水平线", "hr"],
      label: "分割线",
    },
  ]);
}
