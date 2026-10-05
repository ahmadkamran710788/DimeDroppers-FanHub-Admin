import { Info, User } from "lucide-react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import Toggle from "@/components/common/toggle";
import Tooltip from "@/components/common/tooltip";
import {
  MESSAGE_MAX,
  SAMPLE_GAMES,
  SAMPLE_RECIPIENTS,
  type RecognitionGame,
} from "@/components/recognition/add-recognition/data";
import SectionHeading from "@/components/recognition/add-recognition/section-heading";
import type { RecognitionCategory, RecognitionTemplate } from "@/components/recognition/recognitions-data";
import { CATEGORIES, TEMPLATES } from "@/components/recognition/templates";

export interface CustomizeForm {
  gameId: string;
  recipientId: string;
  message: string;
  recognizedBy: string;
  role: string;
  showTimestamp: boolean;
  pinToTop: boolean;
  allowComments: boolean;
}

interface CustomizeStepProps {
  category: RecognitionCategory;
  template: RecognitionTemplate;
  onCategory: (c: RecognitionCategory) => void;
  onTemplate: (t: RecognitionTemplate) => void;
  form: CustomizeForm;
  errors: Record<string, string>;
  update: <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => void;
}

const LABEL = "text-white text-sm";
const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-5 lg:p-6 flex flex-col gap-6";

const gameLabel = (g: RecognitionGame) =>
  g.date
    ? `${g.label} · ${new Date(g.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${new Date(g.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    : g.label;

const OPTIONS: { key: "showTimestamp" | "pinToTop" | "allowComments"; title: string; description: string; hint: string }[] = [
  {
    key: "showTimestamp",
    title: "Show Timestamp",
    description: "Show time since posted (e.g., 2h, 1d)",
    hint: "Fans see how long ago this recognition was posted.",
  },
  {
    key: "pinToTop",
    title: "Pin to Top",
    description: "Keep this post at the top of the category",
    hint: "Pinned posts stay above newer recognitions in their category.",
  },
  {
    key: "allowComments",
    title: "Allow Comments",
    description: "Let fans comment on this recognition",
    hint: "Fans can reply to this post in the fan app.",
  },
];

// Step 3 of Add Recognition: game, recipient, message and display options.
export default function CustomizeStep({
  category,
  template,
  onCategory,
  onTemplate,
  form,
  errors,
  update,
}: CustomizeStepProps) {
  const game = SAMPLE_GAMES.find((g) => g.id === form.gameId);
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <section className={CARD}>
        <SectionHeading
          step={3}
          title="Customize Recognition"
          description="Fill in the details for your recognition post. The preview on the right will update in real time."
        />
        <hr className="border-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
          <div className="flex flex-col gap-5">
            <Select
              variant="dark"
              label="Category"
              name="category"
              value={category}
              onChange={(e) => onCategory(e.target.value as RecognitionCategory)}
              options={(Object.keys(CATEGORIES) as RecognitionCategory[]).map((c) => ({ label: c, value: c }))}
              icon={CATEGORIES[category].icon("size-5")}
              labelClassName={LABEL}
            />
            <Select
              variant="dark"
              label="Template"
              name="template"
              value={template}
              onChange={(e) => onTemplate(e.target.value as RecognitionTemplate)}
              options={CATEGORIES[category].templates.map((t) => ({ label: t, value: t }))}
              icon={TEMPLATES[template].icon("size-5")}
              labelClassName={LABEL}
            />
            <Select
              variant="dark"
              label="Game / Event"
              name="gameId"
              required
              value={form.gameId}
              onChange={(e) => update("gameId", e.target.value)}
              options={SAMPLE_GAMES.map((g) => ({ label: gameLabel(g), value: g.id }))}
              placeholder="Select game or event"
              icon={
                game?.opponent ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.opponent.logo} alt="" className="size-6 rounded-full object-cover" />
                ) : undefined
              }
              error={errors.gameId}
              labelClassName={LABEL}
            />
            <Select
              variant="dark"
              label={`Recognize ${category}`}
              name="recipientId"
              required
              value={form.recipientId}
              onChange={(e) => update("recipientId", e.target.value)}
              options={SAMPLE_RECIPIENTS[category].map((r) => ({
                label: r.number !== undefined ? `#${r.number} ${r.name}` : r.name,
                value: r.id,
              }))}
              placeholder={`Select ${category.toLowerCase()}`}
              icon={<User className="size-5" strokeWidth={2} />}
              error={errors.recipientId}
              labelClassName={LABEL}
            />
          </div>

          <div className="flex flex-col gap-5">
            <Textarea
              label="Recognition Message"
              name="message"
              required
              fieldVariant="dark"
              labelClassName={LABEL}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Write why this person deserves recognition."
              maxLength={MESSAGE_MAX}
              rows={5}
              error={errors.message}
            />
            <Input
              variant="dark"
              label="Recognized By"
              name="recognizedBy"
              required
              value={form.recognizedBy}
              onChange={(e) => update("recognizedBy", e.target.value)}
              placeholder="Coach Mike"
              error={errors.recognizedBy}
              labelClassName={LABEL}
            />
            <Input
              variant="dark"
              label="Role"
              name="role"
              required
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="Head Coach"
              error={errors.role}
              labelClassName={LABEL}
            />
          </div>
        </div>
      </section>

      <section className={CARD}>
        <div className="flex flex-col gap-1 text-white">
          <h3 className="text-lg font-semibold">Additional Options</h3>
          <p className="text-sm text-white/75">You can add extra details to make the recognition more informative.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OPTIONS.map(({ key, title, description, hint }) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-sm font-medium text-white">
                {title}
                <Tooltip label={hint} side="top">
                  <span tabIndex={0} aria-label={hint} className="rounded-full focus:outline-none">
                    <Info className="size-4 text-white/60" strokeWidth={1.75} />
                  </span>
                </Tooltip>
              </div>
              <Toggle
                label={description}
                checked={form[key]}
                onChange={(v) => update(key, v)}
                labelPosition="right"
                labelClassName="text-xs font-normal leading-relaxed text-white/75"
                className="items-start"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
