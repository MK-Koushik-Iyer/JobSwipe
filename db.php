<?php
$host = 'localhost'; // Database host
$user = 'root'; // Database username
$pass = 'KMRl@$#$2024#'; // Database password
$db = 'jobswipe'; // Database name

$mysqli = new mysqli($host, $user, $pass, $db);

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}
?>
