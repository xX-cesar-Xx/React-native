<?php
require 'config.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Obtener todos los productos
            $query = "SELECT * FROM productos";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'productos' => $productos
            ]);
            break;
            
        case 'POST':
            // Crear nuevo producto
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['nombre'], $data['descripcion'], $data['precio'], $data['stock'], $data['categoria'])) {
                throw new Exception('Faltan campos obligatorios');
            }
            
            // Manejar la imagen si está presente
            $imagenPath = null;
            if (isset($data['imagen']) && $data['imagen']) {
                $imagenData = $data['imagen'];
                $imagenPath = guardarImagen($imagenData);
            }
            
            $query = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagenURL) 
                      VALUES (:nombre, :descripcion, :precio, :stock, :categoria, :imagenURL)";
            
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':nombre', $data['nombre']);
            $stmt->bindParam(':descripcion', $data['descripcion']);
            $stmt->bindParam(':precio', $data['precio']);
            $stmt->bindParam(':stock', $data['stock']);
            $stmt->bindParam(':categoria', $data['categoria']);
            $stmt->bindParam(':imagenURL', $imagenPath);
            
            if($stmt->execute()) {
                $productoId = $pdo->lastInsertId();
                
                // Obtener el producto recién creado
                $query = "SELECT * FROM productos WHERE id = :id";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':id', $productoId);
                $stmt->execute();
                
                $producto = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Producto creado exitosamente',
                    'producto' => $producto
                ]);
            } else {
                throw new Exception('Error al crear el producto');
            }
            break;
            
        case 'PUT':
            // Actualizar producto
            parse_str(file_get_contents("php://input"), $putData);
            $data = json_decode($putData['data'] ?? '{}', true);
            
            if (!isset($data['id'])) {
                throw new Exception('ID de producto no proporcionado');
            }
            
            // Construir la consulta dinámicamente
            $query = "UPDATE productos SET ";
            $updates = [];
            $params = [];
            
            if (isset($data['nombre'])) {
                $updates[] = "nombre = :nombre";
                $params[':nombre'] = $data['nombre'];
            }
            
            if (isset($data['descripcion'])) {
                $updates[] = "descripcion = :descripcion";
                $params[':descripcion'] = $data['descripcion'];
            }
            
            if (isset($data['precio'])) {
                $updates[] = "precio = :precio";
                $params[':precio'] = $data['precio'];
            }
            
            if (isset($data['stock'])) {
                $updates[] = "stock = :stock";
                $params[':stock'] = $data['stock'];
            }
            
            if (isset($data['categoria'])) {
                $updates[] = "categoria = :categoria";
                $params[':categoria'] = $data['categoria'];
            }
            
            // Manejar imagen si está presente
            if (isset($data['imagen']) && $data['imagen']) {
                $imagenData = $data['imagen'];
                $imagenPath = guardarImagen($imagenData);
                $updates[] = "imagenURL = :imagenURL";
                $params[':imagenURL'] = $imagenPath;
            }
            
            if (empty($updates)) {
                throw new Exception('No hay datos para actualizar');
            }
            
            $query .= implode(", ", $updates) . " WHERE id = :id";
            $params[':id'] = $data['id'];
            
            $stmt = $pdo->prepare($query);
            
            if($stmt->execute($params)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Producto actualizado exitosamente'
                ]);
            } else {
                throw new Exception('Error al actualizar el producto');
            }
            break;
            
        case 'DELETE':
            // Eliminar producto
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['id'])) {
                throw new Exception('ID de producto no proporcionado');
            }
            
            // Primero obtener la ruta de la imagen para eliminarla
            $query = "SELECT imagenURL FROM productos WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':id', $data['id']);
            $stmt->execute();
            
            $producto = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($producto && $producto['imagenURL']) {
                $imagenPath = $_SERVER['DOCUMENT_ROOT'] . parse_url($producto['imagenURL'], PHP_URL_PATH);
                if (file_exists($imagenPath)) {
                    unlink($imagenPath);
                }
            }
            
            // Luego eliminar el producto
            $query = "DELETE FROM productos WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':id', $data['id']);
            
            if($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Producto eliminado exitosamente'
                ]);
            } else {
                throw new Exception('Error al eliminar el producto');
            }
            break;
            
        default:
            throw new Exception('Método no permitido');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function guardarImagen($imagenData) {
    // Extraer la parte base64 de la cadena
    if (strpos($imagenData, 'base64,') !== false) {
        $imagenData = explode('base64,', $imagenData)[1];
    }
    
    $imagenDecodificada = base64_decode($imagenData);
    
    // Generar un nombre único para la imagen
    $nombreImagen = uniqid() . '.jpg';
    $rutaImagen = '/uploads/' . $nombreImagen;
    $rutaCompleta = $_SERVER['DOCUMENT_ROOT'] . $rutaImagen;
    
    // Crear directorio si no existe
    if (!file_exists(dirname($rutaCompleta))) {
        mkdir(dirname($rutaCompleta), 0777, true);
    }
    
    // Guardar la imagen
    if (file_put_contents($rutaCompleta, $imagenDecodificada)) {
        return $rutaImagen;
    } else {
        throw new Exception('Error al guardar la imagen');
    }
}
?>