import { Link, router } from "expo-router";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { styled } from "styled-components/native";
import { FlatList, Alert, Text, TouchableOpacity, View, Image, ActivityIndicator, ScrollView, Animated, Dimensions } from "react-native";
import { auth } from '../Firebase/firebaseconfig';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type AppRoute = "/(proyectos)" | "/(conversor)";

type Ruta = {
    name: string;
    href: AppRoute;
};

type Producto = {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagenURL?: string;
};

type ViewMode = 'single' | 'double';

const ADMIN_EMAIL = 'felipealvaro48@gmail.com';
const API_URL = 'https://felipe25.alwaysdata.net/api/';
const { width: screenWidth } = Dimensions.get('window');

function Inicio() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('double');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    
    // Animación para el sidebar
    const sidebarAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
    const overlayAnimation = useRef(new Animated.Value(0)).current;

    const datarutas: Ruta[] = [
        { name: "proyectos", href: "/(proyectos)" },
        { name: "conversor", href: "/(conversor)" },
    ];
    
    // Función para cargar productos desde alwaysData
    const cargarProductos = async () => {
        try {
            const response = await fetch(`${API_URL}productos.php`);
            const data = await response.json();
            
            if (data.success) {
                setProductos(data.productos);
            } else {
                throw new Error(data.message || 'Error al cargar productos');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los productos');
            console.error("Error cargando productos: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener el perfil del usuario
    const fetchUserProfile = async () => {
        if (!auth.currentUser?.uid) return;
        
        try {
            const response = await fetch(`${API_URL}users.php?uid=${auth.currentUser.uid}`);
            const data = await response.json();
            
            if (data.success) {
                setUserProfile(data.user);
            }
        } catch (error) {
            console.error("Error obteniendo perfil:", error);
        }
    };

    useEffect(() => {
        cargarProductos();
        fetchUserProfile();
    }, []);

    // Funciones para abrir y cerrar el sidebar
    const openSidebar = () => {
        setSidebarVisible(true);
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeSidebar = () => {
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: -screenWidth * 0.8,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setSidebarVisible(false);
        });
    };

    const renderItem = ({ item }: { item: Ruta }) => (
        <Link href={item.href} asChild>
            <SidebarLinkButton onPress={closeSidebar}>
                <SidebarIconContainer>
                    <Primero name="gitlab" size={24} />
                </SidebarIconContainer>
                <SidebarTextContainer>
                    <SidebarTexto>{item.name}</SidebarTexto>
                </SidebarTextContainer>
                <SidebarIconContainer>
                    <Flecha name="arrow-with-circle-right" size={20} />
                </SidebarIconContainer>
            </SidebarLinkButton>
        </Link>
    );

    // Renderizado para vista de un producto por fila
    const renderProductoSingle = ({ item }: { item: Producto }) => (
        <ProductoContainer>
            <ProductoImageContainer>
                {item.imagenURL ? (
                    <ProductoImage source={{ uri: item.imagenURL }} resizeMode="cover" />
                ) : (
                    <PlaceholderImage>
                        <MaterialIcons name="image" size={50} color="#ccc" />
                    </PlaceholderImage>
                )}
            </ProductoImageContainer>
            <ProductoInfo>
                <ProductoNombre numberOfLines={2}>{item.nombre}</ProductoNombre>
                <ProductoDescripcion numberOfLines={3}>{item.descripcion}</ProductoDescripcion>
                <ProductoDetailsContainer>
                    <ProductoPrecio>${item.precio.toFixed(2)}</ProductoPrecio>
                    <ProductoStock>Stock: {item.stock}</ProductoStock>
                </ProductoDetailsContainer>
            </ProductoInfo>
        </ProductoContainer>
    );

    // Renderizado para vista de dos productos por fila
    const renderProductoDouble = ({ item }: { item: Producto }) => (
        <ProductoContainerDouble>
            <ProductoImageContainerDouble>
                {item.imagenURL ? (
                    <ProductoImage source={{ uri: item.imagenURL }} resizeMode="cover" />
                ) : (
                    <PlaceholderImageDouble>
                        <MaterialIcons name="image" size={40} color="#ccc" />
                    </PlaceholderImageDouble>
                )}
            </ProductoImageContainerDouble>
            <ProductoInfoDouble>
                <ProductoNombreDouble numberOfLines={2}>{item.nombre}</ProductoNombreDouble>
                <ProductoDescripcionDouble numberOfLines={2}>{item.descripcion}</ProductoDescripcionDouble>
                <ProductoDetailsContainerDouble>
                    <ProductoPrecioDouble>${item.precio.toFixed(2)}</ProductoPrecioDouble>
                    <ProductoStockDouble>Stock: {item.stock}</ProductoStockDouble>
                </ProductoDetailsContainerDouble>
            </ProductoInfoDouble>
        </ProductoContainerDouble>
    );

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
            Alert.alert('Éxito', 'Sesión cerrada correctamente');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Botón de admin para el sidebar
    const adminButton = auth.currentUser?.email === ADMIN_EMAIL ? (
        <Link href="/(proyectos)/agregar-producto" asChild>
            <SidebarAdminButton onPress={closeSidebar}>
                <SidebarIconContainer>
                    <Primero name="pluscircleo" size={24} />
                </SidebarIconContainer>
                <SidebarTextContainer>
                    <SidebarTexto>Agregar Productos</SidebarTexto>
                </SidebarTextContainer>
                <SidebarIconContainer>
                    <Flecha name="arrow-with-circle-right" size={20} />
                </SidebarIconContainer>
            </SidebarAdminButton>
        </Link>
    ) : null;

    return (
        <>
            <GradientBackground />
            <BlurredOverlay />
            <MainScrollView showsVerticalScrollIndicator={false}>
                <Container>
                    {/* Header Section con botón de menú */}
                    <HeaderSection>
                        <HeaderTopRow>
                            <MenuButton onPress={openSidebar}>
                                <MaterialIcons name="menu" size={28} color="white" />
                            </MenuButton>
                            <SignOutButton onPress={handleSignOut}>
                                <ButtonText>Cerrar sesión</ButtonText>
                                <AntDesign name="logout" size={18} color="white" style={{ marginLeft: 8 }} />
                            </SignOutButton>
                        </HeaderTopRow>
                        <WelcomeText>
                            ¡Bienvenido {userProfile?.nombre || auth.currentUser?.email}!
                        </WelcomeText>
                    </HeaderSection>
                    
                    {/* Products Section */}
                    <SectionContainer>
                        <SectionHeader>
                            <Titulo>Productos Disponibles</Titulo>
                            <ViewModeContainer>
                                <ViewModeButton 
                                    active={viewMode === 'single'}
                                    onPress={() => setViewMode('single')}
                                >
                                    <MaterialIcons 
                                        name="view-agenda" 
                                        size={18} 
                                        color={viewMode === 'single' ? '#fff' : '#666'} 
                                    />
                                    <ViewModeText active={viewMode === 'single'}>
                                        Una columna
                                    </ViewModeText>
                                </ViewModeButton>
                                
                                <ViewModeButton 
                                    active={viewMode === 'double'}
                                    onPress={() => setViewMode('double')}
                                >
                                    <MaterialIcons 
                                        name="view-module" 
                                        size={18} 
                                        color={viewMode === 'double' ? '#fff' : '#666'} 
                                    />
                                    <ViewModeText active={viewMode === 'double'}>
                                        Dos columnas
                                    </ViewModeText>
                                </ViewModeButton>
                            </ViewModeContainer>
                        </SectionHeader>
                        
                        {loading ? (
                            <LoadingContainer>
                                <ActivityIndicator size="large" color="#ffffff" />
                                <LoadingText>Cargando productos...</LoadingText>
                            </LoadingContainer>
                        ) : productos.length > 0 ? (
                            <ProductsList 
                                data={productos}
                                renderItem={viewMode === 'single' ? renderProductoSingle : renderProductoDouble}
                                keyExtractor={(item) => item.id.toString()}
                                numColumns={viewMode === 'double' ? 2 : 1}
                                key={viewMode}
                                columnWrapperStyle={viewMode === 'double' ? { justifyContent: 'space-between' } : undefined}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        ) : (
                            <NoProductsText>No hay productos disponibles</NoProductsText>
                        )}
                    </SectionContainer>
                    
                    {/* Footer */}
                    <FooterContainer>
                        <AntDesign name="gitlab" size={60} color="#E24329"/>
                    </FooterContainer>
                </Container>
            </MainScrollView>

            {/* Sidebar Overlay y Sidebar */}
            {sidebarVisible && (
                <>
                    <SidebarOverlay 
                        as={Animated.View}
                        style={{ opacity: overlayAnimation }}
                        onTouchEnd={closeSidebar}
                        activeOpacity={1}
                    />
                    <SidebarContainer
                        as={Animated.View}
                        style={{
                            transform: [{ translateX: sidebarAnimation }]
                        }}
                    >
                        <SidebarHeader>
                            <SidebarCloseButton onPress={closeSidebar}>
                                <MaterialIcons name="close" size={28} color="white" />
                            </SidebarCloseButton>
                            <SidebarTitle>Menú</SidebarTitle>
                        </SidebarHeader>
                        
                        <SidebarContent>
                            {adminButton}
                            
                            <SidebarMenuList 
                                data={datarutas} 
                                renderItem={renderItem} 
                                keyExtractor={(item) => item.name}
                                scrollEnabled={false}
                            />
                        </SidebarContent>
                        
                        <SidebarFooter>
                            <AntDesign name="gitlab" size={40} color="#E24329"/>
                        </SidebarFooter>
                    </SidebarContainer>
                </>
            )}
        </>
    );
}
export default Inicio; // Agregar esta línea al final del archivo

// Contenedor con degradado
const GradientBackground = styled(LinearGradient).attrs({
  colors: ['rgba(216, 23, 23, 0.5)', 'rgba(255, 200, 0, 0.5)'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Capa de blur encima del degradado
const BlurredOverlay = styled(BlurView).attrs({
  intensity: 50,
  tint: 'light',
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Scroll principal
const MainScrollView = styled.ScrollView`
  flex: 1;
  z-index: 1;
`;

const Container = styled(View)`
    flex: 1;
    background-color: rgba(255, 255, 255, 0.86);
`;

const HeaderSection = styled(View)`
    padding: 20px;
    padding-top: 40px;
    background-color: rgba(101, 19, 195, 0.7);
`;

const HeaderTopRow = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const MenuButton = styled(TouchableOpacity)`
    padding: 8px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.2);
`;

const SectionContainer = styled(View)`
    padding: 20px;
`;

const SectionHeader = styled(View)`
    align-items: center;
    margin-bottom: 20px;
`;

const WelcomeText = styled(Text)`
    font-size: 18px;
    color: white;
    font-weight: 600;
    text-align: center;
`;

const SignOutButton = styled(TouchableOpacity)`
    background-color: #d32f2f;
    padding: 12px 20px;
    border-radius: 25px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-width: 150px;
    height: 45px;
`;

const ButtonText = styled(Text)`
    color: white;
    font-weight: 600;
    font-size: 16px;
`;

const Titulo = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    color: rgba(3, 7, 7, 0.8);
    text-align: center;
`;

const ViewModeContainer = styled(View)`
    flex-direction: row;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 4px;
    margin-bottom: 15px;
`;

const ViewModeButton = styled(TouchableOpacity)<{ active: boolean }>`
    flex-direction: row;
    align-items: center;
    padding: 10px 16px;
    border-radius: 18px;
    background-color: ${props => props.active ? 'rgba(101, 19, 195, 0.8)' : 'transparent'};
    margin: 0 2px;
`;

const ViewModeText = styled(Text)<{ active: boolean }>`
    color: ${props => props.active ? '#fff' : '#666'};
    font-weight: ${props => props.active ? '600' : '400'};
    margin-left: 6px;
    font-size: 13px;
`;

// Estilos del Sidebar
const SidebarOverlay = styled(TouchableOpacity)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
`;

const SidebarContainer = styled(View)`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${screenWidth * 0.8}px;
    background-color: rgba(101, 19, 195, 0.95);
    z-index: 1001;
    shadow-color: #000;
    shadow-offset: 2px 0px;
    shadow-opacity: 0.3;
    shadow-radius: 10px;
    elevation: 10;
`;

const SidebarHeader = styled(View)`
    flex-direction: row;
    align-items: center;
    padding: 20px;
    padding-top: 50px;
    background-color: rgba(101, 19, 195, 1);
    border-bottom-width: 1px;
    border-bottom-color: rgba(255, 255, 255, 0.2);
`;

const SidebarCloseButton = styled(TouchableOpacity)`
    padding: 8px;
    margin-right: 15px;
`;

const SidebarTitle = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    color: white;
`;

const SidebarContent = styled(View)`
    flex: 1;
    padding: 20px;
`;

const SidebarFooter = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-top-width: 1px;
    border-top-color: rgba(255, 255, 255, 0.2);
`;

// Botones del sidebar
const SidebarLinkButton = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.1);
    height: 60px;
`;

const SidebarAdminButton = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    margin-bottom: 20px;
    border-radius: 12px;
    background-color: rgba(195, 19, 123, 0.8);
    height: 60px;
`;

const SidebarIconContainer = styled(View)`
    width: 40px;
    align-items: center;
    justify-content: center;
`;

const SidebarTextContainer = styled(View)`
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    margin-left: 10px;
`;

const SidebarTexto = styled(Text)`
    font-size: 16px;
    font-weight: 600;
    text-transform: capitalize;
    color: white;
`;

const SidebarMenuList = styled(FlatList)`
    flex-grow: 0;
`;

const Flecha = styled(Entypo)`
    color: rgba(255, 255, 255, 0.8);
`;

const Primero = styled(AntDesign)`
    color: rgba(239, 16, 16, 0.88);
`;

// Estilos mejorados para productos - Vista single
const ProductoContainer = styled(View)`
    flex-direction: row;
    background-color:rgba(35, 90, 100, 0.47);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    elevation: 3;
    min-height: 140px;
`;

const ProductoImageContainer = styled(View)`
    width: 120px;
    height: 120px;
    margin-right: 16px;
`;

const ProductoImage = styled(Image)`
    width: 100%;
    height: 100%;
    border-radius: 10px;
    resize-mode: cover;
`;

const PlaceholderImage = styled(View)`
    width: 100%;
    height: 100%;
    border-radius: 10px;
    background-color: #f5f5f5;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e0e0;
`;

const ProductoInfo = styled(View)`
    flex: 1;
    justify-content: space-between;
    padding-vertical: 4px;
`;

const ProductoNombre = styled(Text)`
    font-size: 17px;
    font-weight: bold;
    color: #333;
    line-height: 22px;
`;

const ProductoDescripcion = styled(Text)`
    font-size: 14px;
    color: #666;
    line-height: 18px;
    margin-vertical: 8px;
`;

const ProductoDetailsContainer = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
`;

const ProductoPrecio = styled(Text)`
    font-size: 18px;
    font-weight: bold;
    color: #E24329;
`;

const ProductoStock = styled(Text)`
    font-size: 13px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 4px 8px;
    border-radius: 12px;
`;

// Estilos mejorados para productos - Vista double
const ProductoContainerDouble = styled(View)`
    background-color:rgba(63, 43, 150, 0.29);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    elevation: 3;
    width: 47%;
    min-height: 320px;
`;

const ProductoImageContainerDouble = styled(View)`
    width: 100%;
    height: 150px;
    margin-bottom: 12px;
`;

const PlaceholderImageDouble = styled(View)`
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background-color: #f5f5f5;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e0e0;
`;

const ProductoInfoDouble = styled(View)`
    flex: 1;
    justify-content: space-between;
`;

const ProductoNombreDouble = styled(Text)`
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 6px;
    line-height: 18px;
`;

const ProductoDescripcionDouble = styled(Text)`
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    line-height: 16px;
`;

const ProductoDetailsContainerDouble = styled(View)`
    margin-top: auto;
`;

const ProductoPrecioDouble = styled(Text)`
    font-size: 16px;
    font-weight: bold;
    color: #E24329;
    margin-bottom: 4px;
`;

const ProductoStockDouble = styled(Text)`
    font-size: 11px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 3px 6px;
    border-radius: 10px;
    align-self: flex-start;
`;

const ProductsList = styled(FlatList)`
    flex-grow: 0;
`;

const LoadingContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 40px 0;
`;

const LoadingText = styled(Text)`
    font-size: 16px;
    color: white;
    margin-top: 10px;
`;

const NoProductsText = styled(Text)`
    font-size: 16px;
    color: white;
    text-align: center;
    padding: 40px 0;
`;

const FooterContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(19, 163, 195, 0.3);
`;