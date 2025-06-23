import { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView } from 'react-native';
import { styled } from 'styled-components/native';
import { Link, router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';

// Importaciones optimizadas de Firebase
import { auth } from '../Firebase/firebaseconfig';
import { 
  initializeDatabase,
  createUserWithProfile 
} from '../Firebase/Firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// Tipo para el estado del formulario
interface FormData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  usuario: string;
  edad: string;
  direccion: string;
}

export default function AuthScreen() {
  // Estados con tipado explícito
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    usuario: '',
    edad: '',
    direccion: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Reemplaza tu useEffect actual con este código corregido
  useEffect(() => {
    let unsubscribe: () => void;
    
    const initFirebase = async () => {
      try {
        await initializeDatabase();
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          if (user) router.replace('/Home');
        });
      } catch (err) {
        console.error("Firebase init error:", err);
        setError("Error al inicializar la aplicación");
      }
    };

    initFirebase();

    // Función de limpieza que se ejecutará al desmontar el componente
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Manejo de cambios en el formulario
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Validación mejorada del formulario
  const validateInputs = (): boolean => {
    const { email, password, nombre, apellido, edad } = formData;
    
    if (!email || !password) {
      setError('Email y contraseña son requeridos');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un email válido');
      return false;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (isSignUp) {
      if (!nombre || !apellido) {
        setError('Nombre y apellido son requeridos');
        return false;
      }
      
      if (edad && isNaN(Number(edad))) {
        setError('La edad debe ser un número');
        return false;
      }
    }
    
    return true;
  };

  // Registro de usuario optimizado
  const handleSignUp = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      await createUserWithProfile(
        formData.email,
        formData.password,
        {
          nombre: formData.nombre,
          apellido: formData.apellido,
          usuario: formData.usuario || formData.email.split('@')[0],
          edad: formData.edad ? parseInt(formData.edad) : undefined,
          direccion: formData.direccion || undefined
        }
      );
      Alert.alert('Éxito', 'Registro completado');
      resetForm();
    } catch (error) {
      handleAuthError(error, 'registro');
    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión
  const handleSignIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (error) {
      handleAuthError(error, 'inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  // Cierre de sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Éxito', 'Sesión cerrada');
    } catch (error) {
      handleAuthError(error, 'cierre de sesión');
    }
  };

  // Manejo de errores tipado
  const handleAuthError = (error: unknown, action: string) => {
    const defaultMsg = `Error en ${action}`;
    
    if (error instanceof FirebaseError) {
      const messages = {
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/invalid-email': 'Correo electrónico no válido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
      };
      
      setError(messages[error.code] || error.message);
    } else {
      setError(defaultMsg);
    }
    
    Alert.alert('Error', error instanceof Error ? error.message : defaultMsg);
  };

  // Reset del formulario
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      usuario: '',
      edad: '',
      direccion: ''
    });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#6a1b9a" />
        <LoadingText>Cargando...</LoadingText>
      </LoadingContainer>
    );
  }

  // Renderizado
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Container>
        {user ? (
          <AuthenticatedView>
            <WelcomeText>Bienvenido, {user.email}</WelcomeText>
            <AuthButton onPress={handleSignOut}>
              <ButtonText>Cerrar sesión</ButtonText>
            </AuthButton>
            <Link href="/Home" asChild>
              <NavLink>Ir al inicio</NavLink>
            </Link>
          </AuthenticatedView>
        ) : (
          <AuthView>
            <Title>{isSignUp ? 'Registro' : 'Inicio de sesión'}</Title>
            <AuthIcon name="lock" size={50} />
            
            {error ? <ErrorText>{error}</ErrorText> : null}
            
            {isSignUp && (
              <>
                <StyledInput
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChangeText={(text) => handleChange('nombre', text)}
                />
                <StyledInput
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChangeText={(text) => handleChange('apellido', text)}
                />
                <StyledInput
                  placeholder="Nombre de usuario"
                  value={formData.usuario}
                  onChangeText={(text) => handleChange('usuario', text)}
                  autoCapitalize="none"
                />
                <StyledInput
                  placeholder="Edad"
                  value={formData.edad}
                  onChangeText={(text) => handleChange('edad', text)}
                  keyboardType="numeric"
                />
                <StyledInput
                  placeholder="Dirección"
                  value={formData.direccion}
                  onChangeText={(text) => handleChange('direccion', text)}
                />
              </>
            )}
            
            <StyledInput
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <StyledInput
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <AuthButton onPress={isSignUp ? handleSignUp : handleSignIn}>
              <ButtonText>{isSignUp ? 'Registrarse' : 'Iniciar sesión'}</ButtonText>
            </AuthButton>
            
            <ToggleAuthButton onPress={() => setIsSignUp(!isSignUp)}>
              <ToggleAuthText>
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </ToggleAuthText>
            </ToggleAuthButton>
          </AuthView>
        )}
      </Container>
    </ScrollView>
  );
}

// Componentes estilizados (sin cambios)
const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 20px;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: #333;
`;

const AuthView = styled.View`
  width: 100%;
  max-width: 400px;
  align-self: center;
  gap: 15px;
`;

const AuthenticatedView = styled.View`
  width: 100%;
  max-width: 400px;
  align-self: center;
  align-items: center;
  gap: 20px;
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  color: #333;
`;

const WelcomeText = styled.Text`
  font-size: 20px;
  text-align: center;
  color: #333;
`;

const AuthIcon = styled(AntDesign)`
  align-self: center;
  margin-bottom: 10px;
  color: #6a1b9a;
`;

const StyledInput = styled.TextInput`
  height: 50px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: white;
  font-size: 16px;
`;

const AuthButton = styled.TouchableOpacity`
  background-color: #6a1b9a;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const ToggleAuthButton = styled.TouchableOpacity`
  margin-top: 15px;
  align-items: center;
`;

const ToggleAuthText = styled.Text`
  color: #6a1b9a;
  font-weight: bold;
`;

const NavLink = styled.Text`
  color: #6a1b9a;
  font-weight: bold;
  margin-top: 10px;
  text-align: center;
`;

const ErrorText = styled.Text`
  color: #d32f2f;
  text-align: center;
  margin-bottom: 10px;
  font-size: 16px;
`;