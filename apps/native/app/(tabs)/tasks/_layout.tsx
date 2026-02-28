import { Stack } from "expo-router";

export default function TasksLayout() {
   return (
      <Stack
         screenOptions={{
            animation: "slide_from_right",
            headerShown: false,
         }}
      >
         <Stack.Screen
            name="index"
            options={{
               headerShown: false,
               title: "Toaday Tasks",
            }}
         />
         <Stack.Screen
            name="add"
            options={{
               title: "Add Task",
            }}
         />
         <Stack.Screen
            name="edit"
            options={{
               title: "Edit Task",
            }}
         />

         <Stack.Screen
            name="all"
            options={{
               title: "All Tasks",
            }}
         />

         <Stack.Screen
            name="consistency"
            options={{
               title: "Task History",
            }}
         />
      </Stack>
   );
}
