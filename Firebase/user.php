<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Crear usuario
        $data = json_decode(file_get_contents("php://input"));
        
        $query = "INSERT INTO usuarios (firebase_uid, email, nombre, apellido, usuario, edad, direccion) 
                  VALUES (:firebase_uid, :email, :nombre, :apellido, :usuario, :edad, :direccion)";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':firebase_uid', $data->firebase_uid);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':nombre', $data->nombre);
        $stmt->bindParam(':apellido', $data->apellido);
        $stmt->bindParam(':usuario', $data->usuario);
        $stmt->bindParam(':edad', $data->edad);
        $stmt->bindParam(':direccion', $data->direccion);
        
        if($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario creado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
        }
        break;

    case 'GET':
        // Obtener usuario por UID de Firebase
        $firebase_uid = $_GET['uid'];
        
        $query = "SELECT * FROM usuarios WHERE firebase_uid = :firebase_uid";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':firebase_uid', $firebase_uid);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        break;
        
    // Puedes añadir más métodos (PUT, DELETE) según necesites
}
?>