import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SectionLabel } from "../../../components/ui";

const CIRCLE_SIZE = 100;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({ percent, colorClass }: { percent: number; colorClass: string }) {
	const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * percent) / 100;

	// Let's use pure inline colors for the stroke, relying on tailwind for the text color
	// or use basic theme colors mapped to hex. Let's use Tailwind via className for container 
	// and pass hex color for stroke. 

	const strokeColor = percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444"; // Adjust according to theme

	return (
		<View className="relative items-center justify-center m-2">
			<Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
				{/* Background track */}
				<Circle
					stroke="rgba(150, 150, 150, 0.2)"
					fill="none"
					cx={CIRCLE_SIZE / 2}
					cy={CIRCLE_SIZE / 2}
					r={RADIUS}
					strokeWidth={STROKE_WIDTH}
				/>
				{/* Foreground progress */}
				<Circle
					stroke={strokeColor}
					fill="none"
					cx={CIRCLE_SIZE / 2}
					cy={CIRCLE_SIZE / 2}
					r={RADIUS}
					strokeWidth={STROKE_WIDTH}
					strokeDasharray={CIRCUMFERENCE}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
				/>
			</Svg>
			<View className="absolute items-center justify-center">
				<Text className="text-3xl font-sans-extrabold text-foreground">{percent}%</Text>
			</View>
		</View>
	);
}

function HeatDots({ values }: { values: number[] }) {
	return (
		<View className="flex-row gap-0.5 mt-1">
			{values.slice(0, 14).map((value, index) => {
				const shade =
					value >= 0.95
						? "bg-success"
						: value >= 0.5
							? "bg-warning"
							: value > 0
								? "bg-warning/40"
								: "bg-muted";
				return <View key={index} className={`h-full w-2 flex-1 rounded-sm ${shade}`} />;
			})}
		</View>
	);
}

export function BentoDashboard({ consistency }: { consistency: any }) {
	const percent = consistency?.consistencyPct ?? 0;
	// Ambient glow uses opacity
	const glowColorClass = percent >= 80 ? "bg-success/15" : percent >= 50 ? "bg-warning/15" : "bg-danger/15";

	return (
		<View className="flex-row gap-3">
			{/* Main Tile - Rhythm Score */}
			<View className="flex-[3] bg-surface rounded-3xl border border-border p-4 shadow-sm relative overflow-hidden items-center justify-center">
				{/* Ambient Glow */}
				<View className={`absolute -bottom-10 -right-10 h-32 w-32 rounded-full blur-2xl ${glowColorClass}`} />

				<Text className="text-xs font-sans-bold text-muted-foreground self-start mb-2 uppercase tracking-wider">
					Rhythm Score
				</Text>

				<CircularProgress percent={percent} colorClass={glowColorClass} />

				<Text className="text-[10px] text-muted-foreground font-sans-medium mt-2 text-center uppercase tracking-widest">
					30 Days
				</Text>
			</View>

			{/* Support Tiles Column */}
			<View className="flex-[2] gap-3">
				{/* Streaks Tile */}
				<View className="flex-1 bg-surface rounded-3xl border border-border p-3 shadow-sm justify-center">
					<View className="flex-row items-baseline justify-between mb-1">
						<Text className="text-xs text-muted-foreground font-sans-medium">Current</Text>
						<Text className="text-xl font-sans-extrabold text-foreground">{consistency?.currentStreak ?? 0}d</Text>
					</View>
					<View className="flex-row items-baseline justify-between">
						<Text className="text-xs text-muted-foreground font-sans-medium">Best</Text>
						<Text className="text-sm font-sans-bold text-muted-foreground">{consistency?.bestStreak ?? 0}d</Text>
					</View>
				</View>

				{/* Heatmap/Activity Tile */}
				<View className="flex-1 bg-surface rounded-3xl border border-border p-3 flex-col justify-between shadow-sm">
					<Text className="text-[10px] text-muted-foreground font-sans-bold uppercase">Activity (14d)</Text>
					<View className="flex-1 mt-1 flex-row">
						<HeatDots values={(consistency?.trend || []).map((item: any) => item.score)} />
					</View>
				</View>
			</View>
		</View>
	);
}
