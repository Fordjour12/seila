import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui";
import type {
   HabitAnchor,
   HabitCadence,
   HabitDifficulty,
   HabitKind,
} from "@/lib/productivity-refs";
import { formatDayKey, parseDayKey, toLocalDayKey } from "@/lib/date";

type SectionKey = "rhythm" | "intensity" | "schedule";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  title: string;
  name: string;
  anchor: HabitAnchor;
  difficulty: HabitDifficulty;
  kind: HabitKind;
  cadenceType: "daily" | "weekdays" | "custom";
  customDays: DayOfWeek[];
  startDayKey?: string;
  endDayKey?: string;
  targetValue: string;
  targetUnit: string;
  timezone: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onNameChange: (value: string) => void;
  onAnchorChange: (value: HabitAnchor) => void;
  onDifficultyChange: (value: HabitDifficulty) => void;
  onKindChange: (value: HabitKind) => void;
  onCadenceTypeChange: (value: "daily" | "weekdays" | "custom") => void;
  onCustomDaysChange: (days: DayOfWeek[]) => void;
  onStartDayKeyChange: (value?: string) => void;
  onEndDayKeyChange: (value?: string) => void;
  onTargetValueChange: (value: string) => void;
  onTargetUnitChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const DAY_OPTIONS = [
   { value: 0, label: "Sun" },
   { value: 1, label: "Mon" },
   { value: 2, label: "Tue" },
   { value: 3, label: "Wed" },
   { value: 4, label: "Thu" },
   { value: 5, label: "Fri" },
   { value: 6, label: "Sat" },
] as const;

function toTitleCase(value: string) {
   return value
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
}

function toggleDay(days: DayOfWeek[], day: DayOfWeek): DayOfWeek[] {
  if (days.includes(day)) return days.filter((value) => value !== day) as DayOfWeek[];
  return [...days, day].sort((a, b) => a - b) as DayOfWeek[];
}

function safeDateFromDayKey(dayKey?: string) {
   try {
      const d = parseDayKey(dayKey);
      // parseDayKey might return Invalid Date depending on your implementation
      if (!d || Number.isNaN(d.getTime())) return new Date();
      return d;
   } catch {
      return new Date();
   }
}

function dayLabels(days: DayOfWeek[]) {
  if (!days.length) return "Pick days";
  const map = new Map(DAY_OPTIONS.map((d) => [d.value, d.label] as const));
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => map.get(d) ?? "?")
    .join(", ");
}

function summarizeCadence(cadenceType: Props["cadenceType"], customDays: DayOfWeek[]) {
  if (cadenceType === "daily") return "Daily";
  if (cadenceType === "weekdays") return "Weekdays";
  return `Custom: ${dayLabels(customDays)}`;
}

function summarizeDates(startDayKey?: string, endDayKey?: string) {
   const start = startDayKey ? formatDayKey(startDayKey) : "Not set";
   const end = endDayKey ? formatDayKey(endDayKey) : "Forever";
   return `${start} → ${end}`;
}

function InlineHint({
   tone = "info",
   children,
}: {
   tone?: "info" | "danger";
   children: React.ReactNode;
}) {
   const base =
      tone === "danger"
         ? "bg-danger/10 border-danger/20 text-danger"
         : "bg-primary/5 border-border text-foreground/80";
   return (
      <View className={`rounded-xl border px-3 py-2 ${base}`}>
         <Text className={`text-xs font-sans-medium ${tone === "danger" ? "text-danger" : "text-foreground/80"}`}>
            {children}
         </Text>
      </View>
   );
}

function SectionCard({
   title,
   description,
   summary,
   open,
   onToggle,
   children,
}: {
   title: string;
   description: string;
   summary?: string;
   open: boolean;
   onToggle: () => void;
   children: React.ReactNode;
}) {
   return (
      <View className="rounded-2xl border border-border bg-surface/80 overflow-hidden">
         <Pressable onPress={onToggle} className="px-4 py-3">
            <View className="flex-row items-center gap-3">
               <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-foreground">{title}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 font-sans-medium">{description}</Text>
                  {!open && summary ? (
                     <Text className="text-xs text-foreground/80 mt-2 font-sans-medium">{summary}</Text>
                  ) : null}
               </View>
               <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={16} color="#9ca3af" />
            </View>
         </Pressable>
         {open ? <View className="px-4 pb-4 gap-3">{children}</View> : null}
      </View>
   );
}

function Segment<T extends string>({
   items,
   value,
   onChange,
   activeClass,
   activeTextClass,
}: {
   items: readonly T[];
   value: T;
   onChange: (value: T) => void;
   activeClass?: string;
   activeTextClass?: string;
}) {
   const activeBg = activeClass || "bg-primary/10 border-primary/30";
   const activeText = activeTextClass || "text-primary";
   return (
      <View className="flex-row flex-wrap gap-2">
         {items.map((item) => {
            const active = value === item;
            return (
               <Pressable
                  key={item}
                  className={`rounded-full border px-3 py-2 ${active ? activeBg : "bg-background border-border"}`}
                  onPress={() => onChange(item)}
               >
                  <Text className={`text-xs font-sans-semibold ${active ? activeText : "text-foreground"}`}>
                     {toTitleCase(item)}
                  </Text>
               </Pressable>
            );
         })}
      </View>
   );
}

function Chip({
   label,
   onPress,
   tone = "neutral",
}: {
   label: string;
   onPress: () => void;
   tone?: "neutral" | "success" | "danger" | "warning";
}) {
   const toneClass =
      tone === "success"
         ? "bg-success/10 border-success/30"
         : tone === "danger"
            ? "bg-danger/10 border-danger/30"
            : tone === "warning"
               ? "bg-warning/10 border-warning/30"
               : "bg-background border-border";
   const textClass =
      tone === "success"
         ? "text-success"
         : tone === "danger"
            ? "text-danger"
            : tone === "warning"
               ? "text-warning"
               : "text-foreground";
   return (
      <Pressable className={`rounded-full border px-3 py-2 ${toneClass}`} onPress={onPress}>
         <Text className={`text-xs font-sans-semibold ${textClass}`}>{label}</Text>
      </Pressable>
   );
}

export function buildCadenceFromForm(
  cadenceType: "daily" | "weekdays" | "custom",
  customDays: DayOfWeek[],
): HabitCadence {
  if (cadenceType === "custom") return { customDays };
  return cadenceType;
}

export function HabitForm({
   title,
   name,
   anchor,
   difficulty,
   kind,
   cadenceType,
   customDays,
   startDayKey,
   endDayKey,
   targetValue,
   targetUnit,
   timezone,
   validationError,
   isSubmitting,
   submitLabel,
   onNameChange,
   onAnchorChange,
   onDifficultyChange,
   onKindChange,
   onCadenceTypeChange,
   onCustomDaysChange,
   onStartDayKeyChange,
   onEndDayKeyChange,
   onTargetValueChange,
   onTargetUnitChange,
   onTimezoneChange,
   onSubmit,
   onCancel,
}: Props) {
   const [showStartPicker, setShowStartPicker] = React.useState(false);
   const [showEndPicker, setShowEndPicker] = React.useState(false);

   // keep collapsible but reduce cognitive load: one open at a time
   const [expanded, setExpanded] = React.useState<Record<SectionKey, boolean>>({
      rhythm: true,
      intensity: false,
      schedule: false,
   });

   // track touched to avoid nagging
   const [touched, setTouched] = React.useState<Record<SectionKey, boolean>>({
      rhythm: false,
      intensity: false,
      schedule: false,
   });

   const openOnly = (key: SectionKey) => {
      setExpanded({ rhythm: false, intensity: false, schedule: false, [key]: true });
   };

   const toggleSection = (key: SectionKey) => {
      setTouched((t) => ({ ...t, [key]: true }));
      setExpanded((current) => {
         const nextOpen = !current[key];
         if (!nextOpen) return { ...current, [key]: false };
         return { rhythm: false, intensity: false, schedule: false, [key]: true };
      });
   };

   // local validation (friendly)
   const rhythmError =
      cadenceType === "custom" && customDays.length === 0 ? "Pick at least 1 day for custom cadence." : null;

   const goalError =
      !targetValue.trim()
         ? "Set a goal value."
         : !targetUnit.trim()
            ? "Set a goal unit (e.g. times, min, pages)."
            : null;

   const dateError = React.useMemo(() => {
      if (!startDayKey || !endDayKey) return null;
      const s = safeDateFromDayKey(startDayKey);
      const e = safeDateFromDayKey(endDayKey);
      return e.getTime() < s.getTime() ? "End date can't be before start date." : null;
   }, [startDayKey, endDayKey]);

   // smart summaries
   const rhythmSummary = `${summarizeCadence(cadenceType, customDays)} · ${toTitleCase(anchor)}`;
   const goalSummary =
      targetValue.trim() && targetUnit.trim()
         ? `${toTitleCase(difficulty)} · ${targetValue.trim()} ${targetUnit.trim()}`
         : `${toTitleCase(difficulty)} · Goal not set`;
   const scheduleSummary = `${summarizeDates(startDayKey, endDayKey)} · ${timezone?.trim() || "UTC"}`;

   // quick picks
   const applyCadencePreset = (preset: "daily" | "weekdays" | "mwf" | "weekend") => {
      setTouched((t) => ({ ...t, rhythm: true }));
      if (preset === "daily") {
         onCadenceTypeChange("daily");
         onCustomDaysChange([]);
         return;
      }
      if (preset === "weekdays") {
         onCadenceTypeChange("weekdays");
         onCustomDaysChange([]);
         return;
      }
      onCadenceTypeChange("custom");
      if (preset === "mwf") onCustomDaysChange([1, 3, 5]);
      if (preset === "weekend") onCustomDaysChange([0, 6]);
   };

   const applyGoalPreset = (preset: "once" | "10min" | "30min" | "limit1" | "ideal0" | "limit3week") => {
      setTouched((t) => ({ ...t, intensity: true }));
      if (preset === "once") {
         onTargetValueChange("1");
         onTargetUnitChange("time");
         return;
      }
      if (preset === "10min") {
         onTargetValueChange("10");
         onTargetUnitChange("min");
         return;
      }
      if (preset === "30min") {
         onTargetValueChange("30");
         onTargetUnitChange("min");
         return;
      }
      if (preset === "ideal0") {
         onTargetValueChange("0");
         onTargetUnitChange("times");
         return;
      }
      if (preset === "limit1") {
         onTargetValueChange("1");
         onTargetUnitChange("times/day");
         return;
      }
      if (preset === "limit3week") {
         onTargetValueChange("3");
         onTargetUnitChange("times/week");
         return;
      }
   };

   const applySchedulePreset = (preset: "today" | "forever" | "30d" | "90d") => {
      setTouched((t) => ({ ...t, schedule: true }));
      const today = new Date();
      const todayKey = toLocalDayKey(today);

      if (preset === "today") {
         onStartDayKeyChange(todayKey);
         return;
      }
      if (preset === "forever") {
         onEndDayKeyChange(undefined);
         return;
      }
      if (preset === "30d" || preset === "90d") {
         if (!startDayKey) onStartDayKeyChange(todayKey);
         const start = safeDateFromDayKey(startDayKey ?? todayKey);
         const days = preset === "30d" ? 30 : 90;
         const end = new Date(start);
         end.setDate(end.getDate() + days);
         onEndDayKeyChange(toLocalDayKey(end));
         return;
      }
   };

   // auto-advance (keep collapsible, but guide)
   React.useEffect(() => {
      if (!expanded.rhythm) return;
      // if user has a valid rhythm selection, nudge forward once they touched rhythm
      if (touched.rhythm && !rhythmError) {
         // open intensity when cadence chosen (and custom days valid)
         openOnly("intensity");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [touched.rhythm, rhythmError]);

   React.useEffect(() => {
      if (!expanded.intensity) return;
      if (touched.intensity && !goalError) {
         openOnly("schedule");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [touched.intensity, goalError]);

   const handleSubmit = () => {
      // guide to the missing thing
      if (rhythmError) {
         openOnly("rhythm");
         setTouched((t) => ({ ...t, rhythm: true }));
         return;
      }
      if (goalError) {
         openOnly("intensity");
         setTouched((t) => ({ ...t, intensity: true }));
         return;
      }
      if (dateError) {
         openOnly("schedule");
         setTouched((t) => ({ ...t, schedule: true }));
         return;
      }
      onSubmit();
   };

   const liveSummary = React.useMemo(() => {
      const mode = kind === "build" ? "Build" : "Break";
      const what = name.trim() ? name.trim() : "Unnamed habit";
      const when = `${summarizeCadence(cadenceType, customDays)} · ${toTitleCase(anchor)}`;
      const goal =
         targetValue.trim() && targetUnit.trim()
            ? `${targetValue.trim()} ${targetUnit.trim()}`
            : "Goal not set";
      const dates = summarizeDates(startDayKey, endDayKey);
      return { mode, what, when, goal, dates };
   }, [kind, name, cadenceType, customDays, anchor, targetValue, targetUnit, startDayKey, endDayKey]);

   return (
      <View className="gap-4">
         <View className="relative rounded-3xl border border-border bg-card p-5 overflow-hidden">
            <View className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10" />
            <View className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-success/10" />

            <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground font-sans-semibold">
               {title}
            </Text>
            <Text className="text-3xl font-sans-extrabold text-foreground tracking-tight mt-2">
               {kind === "build" ? "Build a healthy rhythm" : "Break a recurring pattern"}
            </Text>
            <Text className="text-sm text-muted-foreground mt-2 font-sans-medium">
               {kind === "build"
                  ? "Define a behavior you want to repeat consistently."
                  : "Define a behavior you want to reduce and track with a limit."}
            </Text>

            <View className="mt-5 gap-3">
               <View className="gap-2">
                  <Text className="text-xs uppercase tracking-wider text-muted-foreground font-sans-semibold">Mode</Text>
                  <Segment
                     items={["build", "break"] as const}
                     value={kind}
                     onChange={(v) => {
                        onKindChange(v);
                        // helpful defaults on mode switch
                        if (v === "build") {
                           if (!targetValue) onTargetValueChange("1");
                           if (!targetUnit) onTargetUnitChange("time");
                        } else {
                           if (!targetValue) onTargetValueChange("1");
                           if (!targetUnit) onTargetUnitChange("times/day");
                           onAnchorChange("anytime");
                        }
                     }}
                     activeClass={kind === "break" ? "bg-danger/10 border-danger/30" : "bg-success/10 border-success/30"}
                     activeTextClass={kind === "break" ? "text-danger" : "text-success"}
                  />
               </View>

               <TextInput
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground font-sans-medium"
                  placeholder={kind === "build" ? "What do you want to start doing?" : "What do you want to stop doing?"}
                  placeholderTextColor="#6b7280"
                  value={name}
                  onChangeText={onNameChange}
                  autoFocus
               />

               {validationError ? (
                  <View className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
                     <Text className="text-xs text-danger font-sans-medium">{validationError}</Text>
                  </View>
               ) : null}
            </View>
         </View>

         <SectionCard
            title="How often + when"
            description="Cadence and anchor"
            summary={rhythmSummary}
            open={expanded.rhythm}
            onToggle={() => toggleSection("rhythm")}
         >
            <InlineHint>
               {kind === "build"
                  ? "Pick something you can repeat consistently. Start simple."
                  : "Pick when it usually happens and set a realistic limit."}
            </InlineHint>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Quick Picks</Text>
               <View className="flex-row flex-wrap gap-2">
                  <Chip label="Daily" tone="warning" onPress={() => applyCadencePreset("daily")} />
                  <Chip label="Weekdays" tone="warning" onPress={() => applyCadencePreset("weekdays")} />
                  <Chip label="Mon/Wed/Fri" onPress={() => applyCadencePreset("mwf")} />
                  <Chip label="Weekend" onPress={() => applyCadencePreset("weekend")} />
               </View>
            </View>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">How often</Text>
               <Segment
                  items={["daily", "weekdays", "custom"] as const}
                  value={cadenceType}
                  onChange={(v) => {
                     setTouched((t) => ({ ...t, rhythm: true }));
                     onCadenceTypeChange(v);
                     if (v !== "custom") onCustomDaysChange([]);
                  }}
                  activeClass="bg-warning/10 border-warning/30"
                  activeTextClass="text-warning"
               />
            </View>

            {cadenceType === "custom" ? (
               <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                     <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Custom days</Text>
                     <View className="flex-row gap-2">
                        <Chip
                           label="Weekdays"
                           onPress={() => {
                              setTouched((t) => ({ ...t, rhythm: true }));
                              onCustomDaysChange([1, 2, 3, 4, 5]);
                           }}
                        />
                        <Chip
                           label="Clear"
                           onPress={() => {
                              setTouched((t) => ({ ...t, rhythm: true }));
                              onCustomDaysChange([]);
                           }}
                        />
                     </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                     {DAY_OPTIONS.map((day) => {
                        const active = customDays.includes(day.value);
                        return (
                           <Pressable
                              key={day.value}
                              className={`rounded-full border px-3 py-2 ${active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                                 }`}
                              onPress={() => {
                                 setTouched((t) => ({ ...t, rhythm: true }));
                                 onCustomDaysChange(toggleDay(customDays, day.value));
                              }}
                           >
                              <Text className={`text-xs font-sans-semibold ${active ? "text-primary" : "text-foreground"}`}>
                                 {day.label}
                              </Text>
                           </Pressable>
                        );
                     })}
                  </View>

                  {touched.rhythm && rhythmError ? <InlineHint tone="danger">{rhythmError}</InlineHint> : null}
               </View>
            ) : null}

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">When</Text>
               <Segment
                  items={["morning", "afternoon", "evening", "anytime"] as const}
                  value={anchor}
                  onChange={(v) => {
                     setTouched((t) => ({ ...t, rhythm: true }));
                     onAnchorChange(v);
                  }}
                  activeClass="bg-warning/10 border-warning/30"
                  activeTextClass="text-warning"
               />
            </View>

            {/* Manual “Next” for people who don’t want auto-advance */}
            <Button label="Next" variant="ghost" onPress={() => openOnly("intensity")} />
         </SectionCard>

         <SectionCard
            title="Goal"
            description="Difficulty and target"
            summary={goalSummary}
            open={expanded.intensity}
            onToggle={() => toggleSection("intensity")}
         >
            <InlineHint>
               {kind === "build"
                  ? "Start small. You can increase the goal later."
                  : "Set a limit you can realistically meet (slip budget)."}
            </InlineHint>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Quick Goals</Text>
               <View className="flex-row flex-wrap gap-2">
                  {kind === "build" ? (
                     <>
                        <Chip label="1 time" tone="success" onPress={() => applyGoalPreset("once")} />
                        <Chip label="10 min" onPress={() => applyGoalPreset("10min")} />
                        <Chip label="30 min" onPress={() => applyGoalPreset("30min")} />
                     </>
                  ) : (
                     <>
                        <Chip label="Ideal: 0/day" tone="danger" onPress={() => applyGoalPreset("ideal0")} />
                        <Chip label="Max 1/day" tone="warning" onPress={() => applyGoalPreset("limit1")} />
                        <Chip label="Max 3/week" onPress={() => applyGoalPreset("limit3week")} />
                     </>
                  )}
               </View>
            </View>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Difficulty</Text>
               <Segment
                  items={["low", "medium", "high"] as const}
                  value={difficulty}
                  onChange={(v) => {
                     setTouched((t) => ({ ...t, intensity: true }));
                     onDifficultyChange(v);
                  }}
                  activeClass="bg-warning/10 border-warning/30"
                  activeTextClass="text-warning"
               />
            </View>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Goal</Text>
               <View className="flex-row gap-2">
                  <TextInput
                     className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
                     placeholder={kind === "build" ? "Value (e.g. 1)" : "Limit (e.g. 1)"}
                     placeholderTextColor="#6b7280"
                     keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                     value={targetValue}
                     onChangeText={(v) => {
                        setTouched((t) => ({ ...t, intensity: true }));
                        onTargetValueChange(v);
                     }}
                  />
                  <TextInput
                     className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
                     placeholder={kind === "build" ? "Unit (time, min, pages)" : "Unit (times/day)"}
                     placeholderTextColor="#6b7280"
                     value={targetUnit}
                     onChangeText={(v) => {
                        setTouched((t) => ({ ...t, intensity: true }));
                        onTargetUnitChange(v);
                     }}
                     autoCorrect={false}
                     autoCapitalize="none"
                  />
               </View>
            </View>

            {touched.intensity && goalError ? <InlineHint tone="danger">{goalError}</InlineHint> : null}

            <Button label="Next" variant="ghost" onPress={() => openOnly("schedule")} />
         </SectionCard>

         <SectionCard
            title="Dates + timezone"
            description="Optional range + timezone"
            summary={scheduleSummary}
            open={expanded.schedule}
            onToggle={() => toggleSection("schedule")}
         >
            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Quick Picks</Text>
               <View className="flex-row flex-wrap gap-2">
                  <Chip label="Start today" tone="warning" onPress={() => applySchedulePreset("today")} />
                  <Chip label="Forever" onPress={() => applySchedulePreset("forever")} />
                  <Chip label="30 days" onPress={() => applySchedulePreset("30d")} />
                  <Chip label="90 days" onPress={() => applySchedulePreset("90d")} />
               </View>
            </View>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Dates</Text>
               <View className="flex-row gap-2">
                  <Pressable
                     className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
                     onPress={() => {
                        setTouched((t) => ({ ...t, schedule: true }));
                        setShowStartPicker(true);
                     }}
                  >
                     <Text className="text-[11px] text-muted-foreground uppercase tracking-wider font-sans-semibold">Starts</Text>
                     <Text className="text-sm text-foreground mt-1 font-sans-medium">
                        {startDayKey ? formatDayKey(startDayKey) : "Not set"}
                     </Text>
                  </Pressable>
                  <Pressable
                     className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
                     onPress={() => {
                        setTouched((t) => ({ ...t, schedule: true }));
                        setShowEndPicker(true);
                     }}
                  >
                     <Text className="text-[11px] text-muted-foreground uppercase tracking-wider font-sans-semibold">Ends</Text>
                     <Text className="text-sm text-foreground mt-1 font-sans-medium">
                        {endDayKey ? formatDayKey(endDayKey) : "Forever"}
                     </Text>
                  </Pressable>
               </View>

               <View className="flex-row gap-2">
                  <Button label="Clear Start" variant="ghost" onPress={() => onStartDayKeyChange(undefined)} />
                  <Button label="Forever" variant="ghost" onPress={() => onEndDayKeyChange(undefined)} />
               </View>

               {touched.schedule && dateError ? <InlineHint tone="danger">{dateError}</InlineHint> : null}
            </View>

            <View className="gap-2">
               <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
                  Timezone (advanced)
               </Text>
               <TextInput
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
                  placeholder="Africa/Accra"
                  placeholderTextColor="#6b7280"
                  value={timezone}
                  onChangeText={onTimezoneChange}
                  autoCorrect={false}
                  autoCapitalize="none"
               />
               <InlineHint>
                  Tip: keep this as your device timezone unless you’re scheduling across regions.
               </InlineHint>
            </View>
         </SectionCard>

         {/* Live summary */}
         <View className="rounded-2xl border border-border bg-card px-4 py-3">
            <Text className="text-xs uppercase tracking-wider text-muted-foreground font-sans-semibold">Summary</Text>
            <Text className="text-sm text-foreground mt-2 font-sans-semibold">
               {liveSummary.mode}: {liveSummary.what}
            </Text>
            <Text className="text-xs text-foreground/80 mt-1 font-sans-medium">{liveSummary.when}</Text>
            <Text className="text-xs text-foreground/80 mt-1 font-sans-medium">Goal: {liveSummary.goal}</Text>
            <Text className="text-xs text-foreground/80 mt-1 font-sans-medium">Dates: {liveSummary.dates}</Text>
         </View>

         <View className="flex-row gap-2">
            <Button
               label={isSubmitting ? "Saving..." : submitLabel}
               onPress={handleSubmit}
               disabled={isSubmitting}
            />
            {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
         </View>

         {showStartPicker ? (
            <DateTimePicker
               value={safeDateFromDayKey(startDayKey)}
               mode="date"
               display={Platform.OS === "ios" ? "spinner" : "default"}
               onChange={(_event, date) => {
                  // close on both platforms (fixes iOS “never closes”)
                  setShowStartPicker(false);
                  if (date) onStartDayKeyChange(toLocalDayKey(date));
               }}
            />
         ) : null}

         {showEndPicker ? (
            <DateTimePicker
               value={safeDateFromDayKey(endDayKey ?? startDayKey)}
               mode="date"
               display={Platform.OS === "ios" ? "spinner" : "default"}
               onChange={(_event, date) => {
                  setShowEndPicker(false);
                  if (date) onEndDayKeyChange(toLocalDayKey(date));
               }}
            />
         ) : null}
      </View>
   );
}

export default HabitForm;
