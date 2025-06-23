import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
export default function Pantalla (){
    const router = useRouter();
    const {nombre,curso}=useLocalSearchParams()
    return(
        <View style={style.container}>
            <Text style={style.text}>Bienvenido {nombre} a la pantalla 2</Text>
            <Text style={style.text}> estas en la asignatura {curso} </Text>
            <Button title="Click" onPress={() => router.back()}></Button>

        </View>
        
    )
}

const style= StyleSheet.create({
    container:{
        backgroundColor: '#f36851',
        flex:1,
        alignItems:'center'
    },
    text :{
        color:'#2387ff',
        fontSize:40,
        fontWeight:'bold',
        textAlign:'center'
    },
})