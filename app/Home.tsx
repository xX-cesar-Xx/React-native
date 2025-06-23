import { Link, router } from "expo-router";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { styled } from "styled-components/native";
import { FlatList, Alert, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../Firebase/firebaseconfig'; // Importación corregida (case-sensitive)
import { signOut } from 'firebase/auth'; // Importación añadida

type AppRoute = "/(proyectos)" | "/(conversor)";

type Ruta = {
    name: string;
    href: AppRoute;
};

export default function Inicio() {
    const datarutas: Ruta[] = [
        { name: "proyectos", href: "/(proyectos)" },
        { name: "conversor", href: "/(conversor)" },
    ];
    
    const renderItem = ({ item }: { item: Ruta }) => (
        <Link href={item.href} asChild>
            <LinkButton>
                <Primero name="gitlab" size={30} />
                <Texto>{item.name}</Texto>
                <Flecha name="arrow-with-circle-right" size={30} />
            </LinkButton>
        </Link>
    );

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            Alert.alert('Éxito', 'Sesión cerrada correctamente');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <Container>
            <WelcomeContainer>
                <WelcomeText>¡Bienvenido {auth.currentUser?.email}!</WelcomeText>
                <SignOutButton onPress={handleSignOut}>
                    <ButtonText>Cerrar sesión</ButtonText>
                    <AntDesign name="gitlab" size={40} color="rgba(101, 19, 195, 0.5)"/>
                </SignOutButton>
            </WelcomeContainer>
            
            <Titulo>Menu</Titulo>
            <FlatList 
                data={datarutas} 
                renderItem={renderItem} 
                keyExtractor={(item) => item.name}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            
            <Container2>
                <AntDesign name="gitlab" size={100} color="#E24329"/>
            </Container2>
        </Container>
    );
}

// Styled components
const Container = styled(View)`
    flex: 1;
    align-items: center;
    padding: 20px;
    background-color: rgba(101, 19, 195, 0.5);
`;

const WelcomeContainer = styled(View)`
    width: 100%;
    margin-bottom: 20px;
    align-items: center;
`;

const WelcomeText = styled(Text)`
    font-size: 16px;
    color: white;
    margin-bottom: 5px;
`;

const SignOutButton = styled(TouchableOpacity)`
    background-color: #d32f2f;
    padding: 8px 16px;
    border-radius: 20px;
    align-items: center;
    justify-content: center;
`;

const ButtonText = styled(Text)`
    color: white;
    font-weight: 600;
`;

const Container2 = styled(View)`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(19, 163, 195, 0.5);
`;

const Flecha = styled(Entypo)`
    color: rgba(124, 16, 239, 0.88);
    padding: 20px;
`;

const Primero = styled(AntDesign)`
    color: rgba(172, 239, 16, 0.88);
    padding: 20px;
`;

const Titulo = styled(Text)`
    font-size: 50px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgba(3, 7, 7, 0.58);
    text-align: center;
`;

const LinkButton = styled(TouchableOpacity)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1px 1px;
    margin: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    background-color: rgba(19, 195, 169, 0.5);
    width: 90%; 
`;

const Texto = styled(Text)`
    font-size: 20px;
    font-weight: 600;
    text-transform: capitalize;
    color: black;
`;