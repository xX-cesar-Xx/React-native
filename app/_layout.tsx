import { Stack } from "expo-router";
  export default function layout(){
    return(
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="(proyecto)"/>
        <Stack.Screen name="(conversor)"/>
      </Stack>
    )
  }