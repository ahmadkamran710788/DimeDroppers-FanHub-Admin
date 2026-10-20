import type { TicketCampaign, TicketTypeInput } from "@/utils/types/tickets";

// One ticket type ("+ Add" block) of the Create Campaign dialog (form values are strings while typed).
export interface TicketTypeRow {
  key: number;
  title: string;
  description: string;
  amount: string;
  tickets: number;
}

// The fields CampaignFields edits.
export type TierField = "title" | "description" | "amount" | "tickets";

let nextKey = 1;

export const newRow = (): TicketTypeRow => ({ key: nextKey++, title: "", description: "", amount: "", tickets: 1 });

// A row as the API takes it.
export const inputFor = (r: TicketTypeRow): TicketTypeInput => ({
  title: r.title.trim(),
  ...(r.description.trim() && { description: r.description.trim() }),
  price: Number(r.amount),
  quantityPerGame: r.tickets,
});

// The games to attach and to detach to go from the saved campaign to the picked ones.
export const gameChanges = (picked: string[], c: TicketCampaign) => {
  const saved = new Set(c.games.map((g) => g.id));
  const wanted = new Set(picked);
  return {
    attach: picked.filter((id) => !saved.has(id)),
    detach: [...saved].filter((id) => !wanted.has(id)),
  };
};
