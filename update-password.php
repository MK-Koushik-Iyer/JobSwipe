<?php
require 'vendor/autoload.php';
require 'db.php'; // Ensure this path is correct

// Ensure errors are logged and not displayed to the user
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/wamp64/logs/php_error.log'); // Ensure this path is correct and writable

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    session_start();

    try {
        if (!isset($mysqli)) {
            throw new Exception("Database connection not initialized.");
        }

        $email = $_POST['email'];
        $otp = $_POST['otp'];
        $newPassword = $_POST['newPassword'];
        $confirmPassword = $_POST['confirmPassword'];

        if ($newPassword !== $confirmPassword) {
            echo json_encode(['status' => 'error', 'message' => 'Passwords do not match']);
            exit();
        }

        if ($otp != $_SESSION['otp'] || $email != $_SESSION['otp_email']) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid OTP or email']);
            exit();
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        if ($mysqli->connect_errno) {
            throw new Exception("Failed to connect to MySQL: " . $mysqli->connect_error);
        }

        $stmt = $mysqli->prepare('UPDATE users SET password = ? WHERE email = ?');
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $mysqli->error);
        }

        $stmt->bind_param('ss', $hashedPassword, $email);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        echo json_encode(['status' => 'success']);
        $stmt->close();
        $mysqli->close();

    } catch (Exception $e) {
        error_log($e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Internal Server Error']);
    }

} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>
