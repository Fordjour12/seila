import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";

interface DaySelectorProps {
	days: { key: string; label: string; dayNumber: number }[];
	selectedDayKey: string;
	localTodayKey: string;
	onSelect: (key: string) => void;
}

export function DaySelector({ days, selectedDayKey, localTodayKey, onSelect }: DaySelectorProps) {
	const scrollViewRef = useRef<ScrollView>(null);

	// Center the selected day if it changes or on mount
	useEffect(() => {
		const index = days.findIndex((d) => d.key === selectedDayKey);
		if (index !== -1 && scrollViewRef.current) {
			// Approximate width of a day card is 64 plus margin
			// Not perfect centering but helps ensure it's in view
			scrollViewRef.current.scrollTo({ x: index * 64, animated: true });
		}
	}, [selectedDayKey, days]);

	return (
		<View className="-mx-4 pb-2">
			<ScrollView
				ref={scrollViewRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16 }}
			>
				<View className="flex-row gap-3">
					{days.map((day) => {
						const isSelected = day.key === selectedDayKey;
						const isToday = day.key === localTodayKey;

						return (
							<Pressable
								key={day.key}
								onPress={() => onSelect(day.key)}
								className={`w-[64px] h-[84px] items-center justify-center rounded-2xl border ${isSelected
										? "bg-surface border-primary shadow-sm"
										: "bg-surface/50 border-transparent"
									}`}
								style={
									isSelected
										? {
											shadowColor: "#000",
											shadowOffset: { width: 0, height: 4 },
											shadowOpacity: 0.1,
											shadowRadius: 6,
											elevation: 4,
										}
										: {}
								}
							>
								<Text
									className={`text-[11px] font-sans-medium tracking-wider uppercase mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"
										}`}
								>
									{day.label}
								</Text>

								<Text
									className={`text-xl font-sans-bold ${isSelected ? "text-foreground" : "text-muted-foreground"
										}`}
								>
									{day.dayNumber}
								</Text>

								<View className="h-1.5 w-1.5 rounded-full mt-2 justify-center items-center">
									{isToday && (
										<View
											className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground"
												}`}
										/>
									)}
								</View>

								{isSelected && (
									<View className="absolute inset-0 rounded-2xl border border-primary opacity-20 bg-primary/5" pointerEvents="none" />
								)}
							</Pressable>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}
