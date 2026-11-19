"use client";

import { useState } from "react";
import GenericTable, { type Column } from "@/components/common/generic-table";
import CardFrame from "@/components/organization/fanhub-ai/card-frame";
import KeyValueList from "@/components/organization/fanhub-ai/key-value-list";
import { fieldLabel, formatValue, isFlat } from "@/components/organization/fanhub-ai/data";
import type { OrgListData } from "@/utils/types/organiser-agent";

// More columns than this and the rest open under a row instead.
const MAX_COLUMNS = 6;

type Item = Record<string, unknown>;

interface ListCardProps {
  data: OrgListData;
}

// ORG_LIST: the item keys are the columns. Ids and nested records stay out of the table; a row with more
// than fits opens to show every field.
export default function ListCard({ data }: ListCardProps) {
  const items = Array.isArray(data.items) ? data.items : [];
  const [openRow, setOpenRow] = useState<number | null>(null);

  const keys: string[] = [];
  for (const item of items) {
    for (const key of Object.keys(item)) if (!keys.includes(key)) keys.push(key);
  }
  const tableKeys = keys.filter((key) => key !== "id" && items.some((item) => isFlat(item[key]) && item[key] != null));
  const shown = tableKeys.slice(0, MAX_COLUMNS);
  const hasMore = keys.some((key) => key !== "id" && !shown.includes(key));

  const columns: Column<Item>[] = shown.map((key) => ({
    header: fieldLabel(key),
    cls: "flex-1 min-w-[120px]",
    cell: (item) => {
      const text = formatValue(item[key]);
      return (
        <span className="truncate" title={text}>
          {text}
        </span>
      );
    },
  }));

  const more = typeof data.more === "number" && data.more > 0 ? data.more : 0;

  return (
    <CardFrame
      title={data.title || "Results"}
      aside={more > 0 && <span className="text-[11px] text-white/50">{`${more.toLocaleString("en-US")} more not shown`}</span>}
    >
      <GenericTable
        columns={columns}
        rows={items}
        getKey={(item, index) => (typeof item.id === "string" ? item.id : String(index))}
        empty="Nothing to show."
        onRowClick={
          hasMore
            ? (item) => {
                const index = items.indexOf(item);
                setOpenRow((open) => (open === index ? null : index));
              }
            : undefined
        }
        renderExpanded={(item) =>
          openRow !== null && items[openRow] === item ? (
            <KeyValueList values={item} className="px-3 py-3 bg-black/30 border-b border-white/20" />
          ) : null
        }
        className="rounded-[4px]"
      />
      {hasMore && <p className="text-[11px] text-white/40">Select a row to see all its details.</p>}
    </CardFrame>
  );
}
