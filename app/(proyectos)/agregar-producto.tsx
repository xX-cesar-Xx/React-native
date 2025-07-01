import { useState } from 'react';
import { Alert, ScrollView, View, TouchableOpacity, Text, ActivityIndicator, Image, Platform } from 'react-native';
import { styled } from 'styled-components/native';
import { Link, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Firebase (solo para autenticación)
import { auth } from '../../Firebase/firebaseconfig';

// Configuración
const ADMIN_EMAIL = 'felipealvaro48@gmail.com';
const API_URL = 'https://felipe25.alwaysdata.net/api/guardar.php';

export default function AgregarProducto() {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar permisos de administrador
  if (auth.currentUser?.email !== ADMIN_EMAIL) {
    return (
      <Container>
        <ErrorText>Acceso restringido</ErrorText>
        <AuthButton onPress={() => router.back()}>
          <ButtonText>Volver</ButtonText>
        </AuthButton>
      </Container>
    );
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      // Pedir permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Error', 'Se necesitan permisos para acceder a las imágenes');
        return;
      }

      // Mostrar opciones para web/emulador
      if (Platform.OS === 'web') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true, // Importante para web
        });

        if (!result.canceled) {
          setSelectedImage(result.assets[0]);
        }
      } else {
        // Para dispositivos móviles - mostrar opciones
        Alert.alert(
          'Seleccionar imagen',
          'Elige una opción',
          [
            { text: 'Cámara', onPress: () => openCamera() },
            { text: 'Galería', onPress: () => openGallery() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Error', 'Se necesitan permisos para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Error al abrir la cámara');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Error al abrir la galería');
    }
  };

  // Función para convertir imagen a base64 (para dispositivos móviles)
  const getBase64FromUri = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  };

  const handleAgregarProducto = async () => {
    // Validar campos
    const { nombre, descripcion, precio, stock, categoria } = formData;
    
    if (!nombre || !descripcion || !precio || !stock || !categoria) {
      setError('Todos los campos son obligatorios');
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    // Validar que precio y stock sean números válidos
    if (isNaN(Number(precio))) {
      setError('El precio debe ser un número válido');
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    if (isNaN(Number(stock))) {
      setError('El stock debe ser un número válido');
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }

    setLoading(true);

    try {
      // Crear objeto con los datos del producto
      const productoData = {
        nombre,
        descripcion,
        precio: Number(precio),
        stock: Number(stock),
        categoria
      };

      // Si hay imagen seleccionada, procesarla
      if (selectedImage) {
        let imageBase64 = '';
        
        if (Platform.OS === 'web' && selectedImage.base64) {
          // En web, ya tenemos base64
          imageBase64 = selectedImage.base64;
        } else if (selectedImage.uri) {
          // En móvil, convertir a base64
          imageBase64 = await getBase64FromUri(selectedImage.uri);
        }

        if (imageBase64) {
          productoData.imagen = imageBase64;
          productoData.imagen_tipo = selectedImage.type || 'image/jpeg';
        }
      }

      console.log('Enviando datos:', { ...productoData, imagen: productoData.imagen ? '[BASE64_DATA]' : 'No imagen' });

      // Enviar datos al servidor
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData)
      });

      const result = await response.json();

      console.log('Respuesta del servidor:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al guardar el producto');
      }

      Alert.alert('Éxito', 'Producto guardado correctamente');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria: ''
      });
      setSelectedImage(null);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      Alert.alert('Error', error.message || 'Ocurrió un error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollContainer>
      <Container>
        <Title>Agregar Nuevo Producto</Title>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <Input 
          placeholder="Nombre del producto*" 
          value={formData.nombre} 
          onChangeText={(text) => handleChange('nombre', text)} 
        />
        <Input 
          placeholder="Descripción*" 
          value={formData.descripcion} 
          onChangeText={(text) => handleChange('descripcion', text)} 
          multiline 
          numberOfLines={3} 
        />
        <Input 
          placeholder="Precio*" 
          value={formData.precio} 
          onChangeText={(text) => handleChange('precio', text)} 
          keyboardType="numeric" 
        />
        <Input 
          placeholder="Stock disponible*" 
          value={formData.stock} 
          onChangeText={(text) => handleChange('stock', text)} 
          keyboardType="numeric" 
        />
        <Input 
          placeholder="Categoría*" 
          value={formData.categoria} 
          onChangeText={(text) => handleChange('categoria', text)} 
        />

        {/* Sección de imagen */}
        <ImageSection>
          <ImageButton onPress={pickImage}>
            <ButtonText>
              {selectedImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </ButtonText>
          </ImageButton>
          
          {selectedImage && (
            <ImagePreview>
              <PreviewImage 
                source={{ uri: selectedImage.uri }} 
                resizeMode="cover"
              />
              <RemoveImageButton onPress={() => setSelectedImage(null)}>
                <RemoveImageText>✕</RemoveImageText>
              </RemoveImageButton>
            </ImagePreview>
          )}
        </ImageSection>

        <AuthButton onPress={handleAgregarProducto} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ButtonText>Agregar Producto</ButtonText>
          )}
        </AuthButton>

        <Link href="/home" asChild>
          <NavLink>Volver al inicio</NavLink>
        </Link>
      </Container>
    </ScrollContainer>
  );
}

// Styled Components
const ScrollContainer = styled(ScrollView)`
  flex: 1;
  background-color: #f5f5f5;
`;

const Container = styled(View)`
  flex: 1;
  padding: 20px;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #333;
`;

const Input = styled.TextInput`
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  font-size: 16px;
`;

const ImageSection = styled(View)`
  margin-bottom: 20px;
`;

const ImageButton = styled(TouchableOpacity)`
  background-color: #2196F3;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-bottom: 10px;
`;

const ImagePreview = styled(View)`
  position: relative;
  align-items: center;
`;

const PreviewImage = styled(Image)`
  width: 200px;
  height: 200px;
  border-radius: 8px;
`;

const RemoveImageButton = styled(TouchableOpacity)`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.8);
  border-radius: 12px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const RemoveImageText = styled(Text)`
  color: white;
  font-weight: bold;
  font-size: 12px;
`;

const AuthButton = styled(TouchableOpacity)`
  background-color: #4CAF50;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
`;

const ButtonText = styled(Text)`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const NavLink = styled(Text)`
  color: #6a1b9a;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
`;

const ErrorText = styled(Text)`
  color: #d34836;
  font-size: 18px;
  text-align: center;
  margin: 20px 0;
`;