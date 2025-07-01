// firebaseInit.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Importar la configuración correctamente
import { firebaseConfig } from './firebaseconfig';

// Definición de tipos para el esquema
interface FieldConfig {
  type: 'string' | 'number' | 'boolean' | 'timestamp';
  required: boolean;
  unique?: boolean;
}

interface CollectionConfig {
  fields: Record<string, FieldConfig>;
  indexes?: {fields: string[]; unique: boolean}[];
}

interface DatabaseSchema {
  version: number;
  collections: Record<string, CollectionConfig>;
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Esquema actualizado con los nuevos campos
const DB_SCHEMA: DatabaseSchema = {
  version: 2, // Incrementado por los cambios
  collections: {
    usuarios: {
      fields: {
        nombre: { type: 'string', required: true },
        apellido: { type: 'string', required: true },
        usuario: { type: 'string', required: true, unique: true },
        correo: { type: 'string', required: true, unique: true },
        edad: { type: 'number', required: false },
        direccion: { type: 'string', required: false },
        imagen: { type: 'string', required: false }, // URL de la imagen de perfil
        rol: { type: 'string', required: false }, // admin, cliente, vendedor, etc.
        formaPago: { type: 'string', required: false }, // tarjeta, efectivo, paypal, etc.
        authUid: { type: 'string', required: true },
        createdAt: { type: 'timestamp', required: true },
        updatedAt: { type: 'timestamp', required: true }
      },
      indexes: [
        { fields: ['usuario'], unique: true },
        { fields: ['correo'], unique: true },
        { fields: ['authUid'], unique: true }
      ]
    },
    productos: {
      fields: {
        nombre: { type: 'string', required: true },
        descripcion: { type: 'string', required: true },
        precio: { type: 'number', required: true },
        cantidad: { type: 'number', required: true },
        imagen: { type: 'string', required: false }, // URL de la imagen del producto
        status: { type: 'boolean', required: true }, // true = activo, false = inactivo
        talla: { type: 'string', required: false }, // XS, S, M, L, XL, XXL, etc.
        color: { type: 'string', required: false }, // rojo, azul, negro, etc.
        gama: { type: 'string', required: false }, // alta, media, baja
        tipo: { type: 'string', required: false }, // casual, formal, deportivo, etc.
        tipo_prenda: { type: 'string', required: false }, // camisa, pantalón, zapatos, etc.
        marca: { type: 'string', required: false }, // Nike, Adidas, Zara, etc.
        createdAt: { type: 'timestamp', required: true },
        updatedAt: { type: 'timestamp', required: true }
      }
    }
  }
};

/**
 * Inicializa la estructura de la base de datos
 * @returns Promise<boolean> - True si se inicializó, false si ya estaba actualizada
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    const metaRef = doc(db, '_system', 'schema');
    const docSnap = await getDoc(metaRef);

    if (!docSnap.exists() || (docSnap.data()?.version ?? 0) < DB_SCHEMA.version) {
      await createDatabaseStructure();
      return true;
    }
    
    console.log('Base de datos ya está actualizada');
    return false;
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw new Error('Error al inicializar la base de datos');
  }
};

/**
 * Crea la estructura inicial de la base de datos
 */
const createDatabaseStructure = async (): Promise<void> => {
  const batch = writeBatch(db);
  
  // Documento de metadatos
  const metaRef = doc(db, '_system', 'schema');
  batch.set(metaRef, {
    version: DB_SCHEMA.version,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now(),
    collections: Object.keys(DB_SCHEMA.collections)
  });

  // Configuración de colecciones
  for (const [collectionName, schema] of Object.entries(DB_SCHEMA.collections)) {
    const collectionRef = doc(db, '_collections', collectionName);
    batch.set(collectionRef, {
      ...schema,
      createdAt: Timestamp.now()
    });
  }

  await batch.commit();
  console.log('Estructura de base de datos creada con éxito');
};

/**
 * Obtiene la configuración de una colección
 * @param collectionName - Nombre de la colección
 * @returns Promise<CollectionConfig> - Configuración de la colección
 */
export const getCollectionConfig = async (collectionName: string): Promise<CollectionConfig> => {
  const docRef = doc(db, '_collections', collectionName);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error(`La colección ${collectionName} no está configurada`);
  }
  
  return docSnap.data() as CollectionConfig;
};

/**
 * Valida un documento contra el esquema de su colección
 * @param collectionName - Nombre de la colección
 * @param data - Datos del documento a validar
 * @returns Promise<boolean> - True si es válido
 * @throws Error con mensajes de validación
 */
export const validateDocument = async (collectionName: string, data: Record<string, any>): Promise<boolean> => {
  const config = await getCollectionConfig(collectionName);
  const errors: string[] = [];
  
  for (const [field, configField] of Object.entries(config.fields)) {
    // Validar campos requeridos
    if (configField.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
      errors.push(`El campo ${field} es requerido`);
      continue;
    }

    // Validar tipos de datos
    if (data[field] !== undefined && data[field] !== null) {
      let isValidType = false;
      
      switch (configField.type) {
        case 'string':
          isValidType = typeof data[field] === 'string';
          break;
        case 'number':
          isValidType = typeof data[field] === 'number';
          break;
        case 'boolean':
          isValidType = typeof data[field] === 'boolean';
          break;
        case 'timestamp':
          isValidType = data[field] instanceof Date || data[field] instanceof Timestamp;
          break;
      }

      if (!isValidType) {
        errors.push(`El campo ${field} debe ser de tipo ${configField.type}`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  
  return true;
};

// Interfaces actualizadas para tipado
interface UserProfileData {
  nombre: string;
  apellido: string;
  usuario?: string;
  edad?: number;
  direccion?: string;
  imagen?: string; // URL de la imagen de perfil
  rol: string; // admin, cliente, vendedor, etc.
  formaPago?: string; // tarjeta, efectivo, paypal, etc.
}

interface ProductData {
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagen?: string; // URL de la imagen del producto
  status: boolean; // true = activo, false = inactivo
  talla?: string; // XS, S, M, L, XL, XXL, etc.
  color?: string; // rojo, azul, negro, etc.
  gama?: string; // alta, media, baja
  tipo?: string; // casual, formal, deportivo, etc.
  tipo_prenda?: string; // camisa, pantalón, zapatos, etc.
  marca?: string; // Nike, Adidas, Zara, etc.
}

/**
 * Crea un nuevo usuario con perfil
 * @param email - Correo electrónico
 * @param password - Contraseña
 * @param userData - Datos del perfil
 * @returns Promise<UserCredential> - Credenciales del usuario
 */
export const createUserWithProfile = async (
  email: string, 
  password: string, 
  userData: UserProfileData
) => {
  try {
    // 1. Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Preparar documento para Firestore
    const userDoc = {
      ...userData,
      usuario: userData.usuario || email.split('@')[0],
      correo: email,
      authUid: userCredential.user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // 3. Validar y crear documento
    await validateDocument('usuarios', userDoc);
    await setDoc(doc(db, "usuarios", userCredential.user.uid), userDoc);
    
    return userCredential;
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
};

/**
 * Crea un nuevo producto
 * @param productData - Datos del producto
 * @returns Promise<string> - ID del producto creado
 */
export const createProduct = async (productData: ProductData): Promise<string> => {
  try {
    // Preparar documento para Firestore
    const productDoc = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // Validar documento
    await validateDocument('productos', productDoc);
    
    // Crear documento con ID auto-generado
    const productRef = doc(db, "productos");
    await setDoc(productRef, productDoc);
    
    return productRef.id;
  } catch (error) {
    console.error('Error creando producto:', error);
    throw error;
  }
};

export { db, auth };