import React, { useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from "react-native-reanimated";

interface HabitCardProps {
	habit: any;
	status: string;
	hasTodayStatus: boolean;
	resolved: boolean;
	isTodayView: boolean;
	isSubmitting: boolean;
	onLog: () => void;
	onSkip: () => void;
	onSnooze: () => void;
	onRelapse: () => void;
	onUndo: () => void;
	onArchive: () => void;
	onEdit: () => void;
	onStats: () => void;
}

const SWIPE_THRESHOLD = -150;

function formatCadence(cadence: any) {
	if (cadence === "daily" || cadence === "weekdays") {
		return (
			cadence.charAt(0).toUpperCase() + cadence.slice(1)
		);
	}

	const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	if (cadence?.customDays) {
		return cadence.customDays.map((day: number) => map[day] || "?").join(", ");
	}
	return "Custom";
}


function toTitleCase(value: string) {
	return value
		.split(/[\s_-]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function HabitCard({
	habit,
	status,
	hasTodayStatus,
	resolved,
	isTodayView,
	isSubmitting,
	onLog,
	onSkip,
	onSnooze,
	onUndo,
	onArchive,
	onEdit,
	onStats,
}: HabitCardProps) {
	const translateX = useSharedValue(0);
	const scaleLogBtn = useSharedValue(1);

	const panGesture = Gesture.Pan()
		.onChange((event) => {
			let nextX = event.translationX;
			// Only allow swiping left
			if (nextX > 0) nextX = 0;
			// Cap at roughly 180px
			if (nextX < -180) nextX = -180 + (nextX + 180) * 0.2;
			translateX.value = nextX;
		})
		.onEnd((event) => {
			if (translateX.value < SWIPE_THRESHOLD || event.velocityX < -500) {
				translateX.value = withSpring(-180);
			} else {
				translateX.value = withSpring(0);
			}
		});

	const cardStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: translateX.value }],
		};
	});

	const handlePressLog = () => {
		scaleLogBtn.value = withTiming(0.8, { duration: 100 }, () => {
			scaleLogBtn.value = withSpring(1);
		});
		if (hasTodayStatus) {
			onUndo();
		} else {
			onLog();
		}
	};

	const handleAction = (action: () => void) => {
		translateX.value = withSpring(0);
		action();
	};

	const isDone = status === "Done Today";

	// Status Colors
	const borderColor = isDone ? "border-success/40" : status === "Skipped Today" || status === "Snoozed Today" ? "border-warning/40" : "border-border";
	const bgGlowClass = isDone ? "bg-success/5" : status === "Skipped Today" || status === "Snoozed Today" ? "bg-warning/5" : "bg-transparent";

	// When done, it's green. When pending, it's a dotted circle or empty circle
	const iconColor = isDone ? "#10b981" : hasTodayStatus ? "#f59e0b" : "#71717a";

	return (
		<View className="mb-3 rounded-2xl bg-surface border border-border overflow-hidden relative shadow-sm">
			{/* Background Actions (Revealed on Swipe) */}
			<View className="absolute right-0 top-0 bottom-0 w-[180px] flex-row p-2 gap-2 justify-end items-center">
				<Pressable
					className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center border border-primary/20"
					onPress={() => handleAction(onSnooze)}
					disabled={isSubmitting || !isTodayView || resolved}
				>
					<Ionicons name="moon-outline" size={18} color="#3b82f6" />
					<Text className="text-[9px] text-primary font-sans-medium mt-1 uppercase">Snooze</Text>
				</Pressable>

				<Pressable
					className="w-12 h-12 rounded-xl bg-warning/10 items-center justify-center border border-warning/20"
					onPress={() => handleAction(onSkip)}
					disabled={isSubmitting || !isTodayView || resolved}
				>
					<Ionicons name="play-skip-forward-outline" size={18} color="#f59e0b" />
					<Text className="text-[9px] text-warning font-sans-medium mt-1 uppercase">Skip</Text>
				</Pressable>

				<Pressable
					className="w-12 h-12 rounded-xl bg-muted/30 items-center justify-center border border-border"
					onPress={() => handleAction(onEdit)}
				>
					<Ionicons name="ellipsis-horizontal-circle-outline" size={18} color="#71717a" />
					<Text className="text-[9px] text-muted-foreground font-sans-medium mt-1 uppercase">More</Text>
				</Pressable>
			</View>

			{/* Foreground Draggable Card */}
			<GestureDetector gesture={panGesture}>
				<Animated.View className={`flex-row p-4 min-h-[80px] bg-background border-l-4 rounded-xl ${borderColor} ${bgGlowClass}`} style={cardStyle}>

					<View className="flex-1 justify-center gap-1.5 pl-1 pr-3">
						<Text className="text-[15px] font-sans-semibold text-foreground tracking-tight shadow-sm leading-tight">
							{habit.name}
						</Text>

						<View className="flex-row items-center gap-1.5 mt-0.5">
							<View className="bg-primary/10 rounded px-1.5 py-0.5 border border-primary/20">
								<Text className="text-[9px] text-primary font-sans-bold uppercase tracking-widest">{toTitleCase(habit.kind || "build")}</Text>
							</View>
							<Text className="text-xs text-muted-foreground font-sans-medium mt-0.5">
								{formatCadence(habit.cadence)}
								{habit.targetValue ? ` · ${habit.targetValue} ${habit.targetUnit || "units"}` : ""}
							</Text>
						</View>
					</View>

					{/* Large Log Button */}
					<View className="justify-center items-center -mr-1">
						<Pressable
							onPress={handlePressLog}
							disabled={isSubmitting || !isTodayView}
							hitSlop={15}
						>
							<Animated.View
								className={`w-[44px] h-[44px] rounded-full border-[1.5px] items-center justify-center ${isDone ? 'bg-success/15 border-success/40' : hasTodayStatus ? 'bg-warning/15 border-warning/40' : 'bg-surface border-muted-foreground/30'}`}
								style={useAnimatedStyle(() => ({ transform: [{ scale: scaleLogBtn.value }] }))}
							>
								{isDone ? (
									<Ionicons name="checkmark-sharp" size={24} color={iconColor} />
								) : hasTodayStatus ? (
									<Ionicons name="arrow-undo-outline" size={20} color={iconColor} />
								) : (
									<View className="w-5 h-5 rounded-full border-[2px] border-muted-foreground/40 border-dashed" />
								)}
							</Animated.View>
						</Pressable>
					</View>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}
