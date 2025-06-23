import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Image } from "react-native";
import { styled, ThemeProvider } from "styled-components/native";
import { useTexto } from "./TextoContext";
import { temaoscuro, temaclaro } from "../../style/theme";

export default function Perfil() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("");
  const [correo, setCorreo] = useState("");
  const { setTexto } = useTexto();
  const [istemaoscuro, setIstemaoscuro] = useState(false);
        const toggleTheme = () => {
            setIstemaoscuro((prevTheme) => !prevTheme);
        }
        
        const currentTheme = istemaoscuro ? temaoscuro : temaclaro;

  const handleEnviarDatos = () => {
    // objeto para enviar los datos
    const datosCompletos = {
      nombre,
      pais,
      correo
    };
    
    // Guardar los datos en el contexto
    setTexto(datosCompletos);
    
    // a la siguiente pantalla
    router.push("./verperfil");
  };

  return (
    <ThemeProvider theme={currentTheme}>
    <Container>
      <Image 
        source={require("../UniversidaddePanama.png")} 
        style={{ width: 200, height: 200 }} 
      />
      <Texto>Parcial#2</Texto>
      <Texto2>Mi aplicacion en RN</Texto2>
      <Texto3>Desarrollo Movil</Texto3>
      <Label2>Formulario:</Label2>

      <Label>Nombre:</Label>
      <TextoInput
        placeholder="Ingrese su nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      
      <Label>País:</Label>
      <TextoInput
        placeholder="Ingrese su Pais"
        value={pais}
        onChangeText={setPais}
      />
      
      <Label>Correo:</Label>
      <TextoInput
        placeholder="Ingrese su correo"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Button
        title="Enviar Datos"
        onPress={handleEnviarDatos}
      />
      <Button 
        title="Cambiar Tema" 
        onPress={toggleTheme} 
      />
    </Container>
    </ThemeProvider>
  );
}

const Container = styled.View`
    background-color: ${({theme}) => theme.Colors.background};
    flex: 1;
    align-items: center;
    justify-content: center;
`;

const Label = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  align-self: flex-start;
  margin-left: 35%;
`;
const Label2 = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 1px;
  align-self: flex-start;
  margin-left: 35%;
`;

const Texto = styled.Text`
  color: rgb(0, 0, 0);
  font-size: 40px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
`;

const Texto2 = styled.Text`
  color: rgba(211, 9, 9, 0.47);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
`;

const Texto3 = styled.Text`
  color: rgba(0, 0, 0, 0.47);
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
`;

const TextoInput = styled.TextInput`
  width: 30%;
  height: 50px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  background-color: white;
`;