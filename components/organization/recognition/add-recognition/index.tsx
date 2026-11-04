"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import Loader from "@/components/common/loader";
import StepIndicator from "@/components/common/step-indicator";
import WizardFooter from "@/components/common/wizard-footer";
import type { MediaGame } from "@/components/organization/media/data";
import CustomizeStep, { type CustomizeForm } from "@/components/organization/recognition/add-recognition/customize-step";
import { customizeRecognitionSchema } from "@/components/organization/recognition/add-recognition/schema";
import TemplateStep, { type TemplateKind } from "@/components/organization/recognition/add-recognition/template-step";
import type { PickedTeam } from "@/components/organization/recognition/add-recognition/team-field";
import { useGamePeople, type PeopleSource } from "@/components/organization/recognition/add-recognition/use-game-people";
import WhoStep, { type Audience } from "@/components/organization/recognition/add-recognition/who-step";
import DonorCard, { SAMPLE_DONOR, type DonorTemplate } from "@/components/organization/recognition/donor-card";
import PlayerCard, { type PlayerRecognition, type PlayerTemplate } from "@/components/organization/recognition/player-card";
import { cardBackground, cardHexOf } from "@/components/organization/recognition/add-recognition/data";
import RecognitionPreview from "@/components/organization/recognition/recognition-preview";
import { badgeKeyOf, badgeLabelOf, cardOf, playerTemplateOf, roleLabelOf, templateHexOf, templateKeyOf } from "@/components/organization/recognition/recognition-api";
import apiCall from "@/utils/api-call";
import type { Recognition, RecognitionBody, RecognitionStatus } from "@/utils/types/recognition";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import toast from "react-hot-toast";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const STEPS = ["who", "template", "details"] as const;
type Step = (typeof STEPS)[number];

const INITIAL_FORM: CustomizeForm = {
  gameId: "",
  teamId: "",
  side: "",
  playerId: "",
  message: "",
  giverId: "",
};

// One side of a school game: that team's roster by its schoolTeamId (the schedule's teamId or
// opponentSchoolTeamId); nobody when the side has no team in Fan Hub.
const schoolSourceOf = (game: MediaGame, side: "home" | "away"): PeopleSource => {
  const schoolTeamId = game.schoolTeamIds?.[side];
  return schoolTeamId ? { key: `${game.id}:${schoolTeamId}`, schoolTeamId } : { key: `${game.id}:${side}`, teams: [] };
};

// Add Recognition wizard: pick who to recognize, then one of the six templates (donor and player),
// then write the details with a live preview. With `editId` it edits that recognition: it opens on Details,
// filled from GET /recognitions/:id, keeps its game and people unless the admin changes them, and saves with
// a full PATCH.
export default function AddRecognitionPage({ editId }: { editId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(editId ? "details" : "who");
  // The recognition being edited, once loaded; null while loading or when adding.
  const [original, setOriginal] = useState<Recognition | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Editing keeps the recognition's game and people until "Change" is pressed.
  const [keepPeople, setKeepPeople] = useState(true);
  const [audience, setAudience] = useState<Audience | "">("");
  const [audienceError, setAudienceError] = useState("");
  // The award badge, picked in Details.
  const [badge, setBadge] = useState<RecognitionTemplate>("Hustle");
  // The card colour picked in Details: "" (the template's), a preset gradient or a hex. Preview only: the API has no colour field yet.
  const [color, setColor] = useState("");
  const [donorTemplate, setDonorTemplate] = useState<DonorTemplate>("Profile & Campaign");
  const [playerTemplate, setPlayerTemplate] = useState<PlayerTemplate>("Game");
  // Every template is offered whoever is recognized (for now); this is the group the picked one is from.
  const [kind, setKind] = useState<TemplateKind>("player");
  const isDonor = kind === "donor";
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  // A tournament's recognition belongs to an event: the one picked in the shared event picker (Details).
  const { event: selectedEvent } = useSelectedEvent();
  // Details: the game ("Game" template) or the tournament team ("Profile" template) the people come from.
  const [game, setGame] = useState<MediaGame | null>(null);
  const [team, setTeam] = useState<PickedTeam | null>(null);
  const [form, setForm] = useState<CustomizeForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    apiCall<{ data: Recognition[] }>({ endpoint: routes.api.recognition(editId), method: "GET" }).then((result) => {
      if (cancelled) return;
      const r = result.success ? result.data?.data?.[0] : undefined;
      if (!r) return setLoadFailed(true);
      setOriginal(r);
      setAudience("Players");
      setKind("player");
      setPlayerTemplate(playerTemplateOf(r.template));
      setBadge(badgeLabelOf(r.awardBadge));
      setColor(r.hexColor ?? "");
      setForm((prev) => ({ ...prev, message: r.description }));
    });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // Kept while editing, as long as the template still matches what the recognition was made with.
  const kept = original && keepPeople && templateKeyOf(playerTemplate) === original.template ? original : null;

  const needsGame = playerTemplate !== "Profile";
  // "Profile" has no game: the team is picked instead (a tournament event team, or one of the school's teams).
  const needsTeam = !needsGame;
  // A school's "Game" template also picks one of the game's two teams.
  const needsSide = needsGame && !isTournament;
  // Whose players, staff and parents to list: a tournament game's two teams; for a school game, the side
  // picked (the school's roster, or nobody for the opponent); the picked tournament team; or the school roster.
  const source: PeopleSource | null = needsGame
    ? !game
      ? null
      : isTournament
        ? { key: game.id, teams: (game.teamIds ?? []).map((id, i) => ({ id, name: (i === 0 ? game.home : game.away).shortName })) }
        : form.side
          ? schoolSourceOf(game, form.side)
          : null
    : needsTeam
      ? team && (isTournament ? { key: team.id, teams: [team] } : { key: team.id, schoolTeamId: team.id })
      : null;
  const { players, givers, loading: peopleLoading } = useGamePeople(source);

  // A new game or team brings other people: the giver and player are picked again.
  const pickGame = (g: MediaGame) => {
    setGame(g);
    setForm((prev) => ({ ...prev, gameId: g.id, side: "", giverId: "", playerId: "" }));
    setErrors((prev) => ({ ...prev, gameId: "" }));
  };
  const pickTeam = (t: PickedTeam) => {
    setTeam(t);
    setForm((prev) => ({ ...prev, teamId: t.id, giverId: "", playerId: "" }));
    setErrors((prev) => ({ ...prev, teamId: "" }));
  };

  const player = players.find((p) => p.id === form.playerId);
  // The panel shows the organisation as Recognized By; the API still takes a person, so the first staff
  // member / parent of the player's team is sent.
  const giver = player ? (givers.find((p) => p.teamKey === player.teamKey) ?? givers[0]) : givers[0];
  const shown = { ...form, giverId: giver?.id ?? "" };

  const update = <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      // Another side of the game brings other people.
      ...(key === "side" && { giverId: "", playerId: "" }),
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // The preview: the kept recognition's game and player, or what's picked so far (a placeholder where
  // nothing is yet); the badge and message as edited.
  const previewData: PlayerRecognition = kept
    ? { ...cardOf(kept), badge, description: form.message.trim() || "Your shout-out will appear here." }
    : {
    player: player
      ? { name: player.name, number: player.number, team: player.team }
      : { name: "Select a player", team: giver?.team ?? team?.name ?? "" },
    game: game ? { date: game.start, home: { name: game.home.shortName, logo: game.home.logo }, away: { name: game.away.shortName, logo: game.away.logo } } : null,
    badge,
    description: form.message.trim() || "Your shout-out will appear here.",
  };

  const index = STEPS.indexOf(step);
  const steps = [
    { title: "Recognize", subtitle: index > 0 && audience ? audience : "Choose who" },
    { title: "Template", subtitle: index > 1 ? (isDonor ? donorTemplate : playerTemplate) : "Choose template" },
    { title: "Details", subtitle: "Write shout-out" },
  ];

  const next = () => {
    if (step === "who") {
      if (!audience) return setAudienceError("Choose who you want to recognize");
      return setStep("template");
    }
    setStep("details");
  };

  const [saving, setSaving] = useState(false);
  // Creates the recognition (POST /fanhub/org/recognitions) and goes to Recognition Posts, where it shows as
  // its card. apiCall toasts the API's reason when it refuses (e.g. a player not on the giver's team).
  const save = async (status: RecognitionStatus) => {
    const rules = kept ? { needsGame: false, needsTeam: false, needsSide: false, needsPeople: false } : { needsGame, needsTeam, needsSide, needsPeople: true };
    if (!(await validateAndSetErrors(customizeRecognitionSchema(rules), shown, setErrors))) return;
    const template = templateKeyOf(playerTemplate);
    if (!template || (!kept && (!player || !giver))) return;
    const people = kept
      ? {
          recognizedBy: { type: kept.recognizedBy.type, id: kept.recognizedBy.id },
          player: { type: kept.player.type, id: kept.player.id },
          ...(kept.scheduleEventId && { scheduleEventId: kept.scheduleEventId }),
        }
      : {
          recognizedBy: { type: giver!.refType, id: giver!.id },
          player: { type: player!.refType, id: player!.id },
          ...(template === "PLAYER_GAME" && game && { scheduleEventId: game.id }),
        };
    // A tournament sends its event (the kept recognition's while editing); a school never does.
    const eventId = isTournament ? (kept?.eventId ?? selectedEvent?.id) : undefined;
    if (isTournament && !eventId) return toast.error("Pick the event first.");
    const body: RecognitionBody = {
      ...(eventId && { eventId }),
      category: "PLAYER",
      template,
      status,
      awardBadge: badgeKeyOf(badge),
      description: form.message.trim(),
      hexColor: cardHexOf(color) || templateHexOf(playerTemplate),
      ...people,
    };
    setSaving(true);
    // Editing replaces every field with PATCH; adding creates with POST.
    const result = await apiCall({
      endpoint: editId ? routes.api.recognition(editId) : routes.api.recognitions,
      method: editId ? "PATCH" : "POST",
      data: { ...body },
      showSuccessToast: true,
      successMessage: editId ? "Recognition updated" : status === "PUBLISHED" ? "Recognition published" : "Saved as draft",
    });
    setSaving(false);
    if (result.success) router.push(routes.ui.recognitionPosts);
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex items-start gap-4">
        <Link href={routes.ui.recognitionPosts} aria-label="Back to Recognitions" className="mt-0.5 text-white hover:opacity-80">
          <ArrowLeft className="size-6" strokeWidth={1.5} />
        </Link>
        <div className="flex flex-col gap-1 text-white">
          <Link href={routes.ui.recognitionPosts} className="text-sm text-white/75 hover:text-white">
            Back to Recognitions
          </Link>
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-tight">{editId ? "Edit Recognition" : "Add Recognition"}</h2>
          <p className="text-base text-white/85">Give a shout-out to a player, coach or the whole team for one of your games.</p>
        </div>
      </div>

      <StepIndicator steps={steps} current={index} className="pb-6 border-b border-white/10" />

      {editId && !original ? (
        loadFailed ? (
          <p className="py-16 text-center text-sm text-white/60">This recognition couldn&apos;t be loaded. It may have been deleted.</p>
        ) : (
          <Loader className="m-10" />
        )
      ) : step === "who" ? (
        <WhoStep
          audience={audience}
          onAudience={(a) => {
            setAudience(a);
            setAudienceError("");
          }}
          error={audienceError}
        />
      ) : step === "template" ? (
        <TemplateStep
          kind={kind}
          onKind={setKind}
          donorTemplate={donorTemplate}
          onDonorTemplate={setDonorTemplate}
          playerTemplate={playerTemplate}
          onPlayerTemplate={setPlayerTemplate}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-8 items-start">
          <CustomizeStep
            template={playerTemplate}
            isTournament={isTournament}
            badge={badge}
            onBadge={setBadge}
            color={color}
            onColor={setColor}
            onGame={pickGame}
            onTeam={pickTeam}
            players={players}
            sourceChosen={!!source}
            kept={
              kept
                ? {
                    giver: `${kept.recognizedBy.name} · ${roleLabelOf(kept.recognizedBy.role)}`,
                    player: kept.player.name,
                    game: kept.game ? `${kept.game.home.name} vs ${kept.game.away.name}` : null,
                    onChange: () => setKeepPeople(false),
                  }
                : null
            }
            gameSides={needsSide && game ? { home: game.teamNames?.home ?? game.home.shortName, away: game.teamNames?.away ?? game.away.shortName } : null}
            peopleLoading={peopleLoading}
            form={shown}
            errors={errors}
            update={update}
          />
          <div className="xl:sticky xl:top-6">
            <RecognitionPreview
              recognition={null}
              card={
                isDonor ? (
                  <DonorCard template={donorTemplate} data={SAMPLE_DONOR} />
                ) : (
                  <PlayerCard template={playerTemplate} data={previewData} gradient={cardBackground(color)} />
                )
              }
              description="This is how it will appear on the fan app."
            />
            {!isDonor && org?.name && <p className="mt-2 px-1 text-xs text-white/60 truncate">{`By ${org.name}`}</p>}
          </div>
        </div>
      )}

      {step === "details" ? (
        <WizardFooter
          onBack={() => setStep("template")}
          backLabel="Back"
          secondaryLabel="Save Draft"
          onSecondary={() => {
            if (!saving) void save("DRAFT");
          }}
          primaryLabel={saving ? "Saving…" : "Publish Recognition"}
          primaryDisabled={saving}
          primaryIcon={<Send className="size-5" strokeWidth={2} />}
          onPrimary={() => void save("PUBLISHED")}
        />
      ) : (
        <WizardFooter
          onBack={step === "who" ? () => router.push(routes.ui.recognitionPosts) : () => setStep("who")}
          backLabel={step === "who" ? "Cancel" : "Back"}
          primaryLabel={step === "template" ? "Use This Template" : "Continue"}
          primaryIcon={<ArrowRight className="size-5" strokeWidth={2} />}
          primaryIconPosition="end"
          onPrimary={next}
        />
      )}
    </div>
  );
}
