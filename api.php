<?php

require_once 'config.php';

// database

$db = NULL;
try {
	$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
} catch (mysqli_sql_exception $e) {
	exit('mysqli::__construct');
}
try {
	if (!$db->set_charset('utf8mb4'))
		exit('mysqli::set_charset');
} catch (mysqli_sql_exception $e) {
	exit('mysqli::set_charset');
}

// station

function station_all(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name` FROM `station` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

function station_code(int $id, string $code): bool {
	global $db;
	$stmt = $db->prepare('SELECT `id` FROM `station` WHERE `id` = ? AND `code` = ?');
	$stmt->bind_param('is', $id, $code);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	return !is_null($item);
}

// team

function team_all(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name` FROM `team` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

// player

function player_all(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name`, `team` FROM `player` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

// api

function json(mixed $mixed): void {
	header('content-type: application/json; charset=utf-8');
	exit(json_encode($mixed));
}

function get_string(string $key): ?string {
	if (!isset($_GET[$key]))
		return NULL;
	$value = $_GET[$key];
	if (!is_string($value))
		return NULL;
	return $value;
}

function post_string(string $key): ?string {
	if (!isset($_POST[$key]))
		return NULL;
	$value = $_POST[$key];
	if (!is_string($value))
		return NULL;
	return $value;
}

function post_int(string $key): ?int {
	$value = post_string($key);
	if (is_null($value))
		return NULL;
	$value = filter_var($value, FILTER_VALIDATE_INT);
	if ($value === FALSE)
		return NULL;
	return $value;
}

function is_get(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'GET' && get_string('action') === $action;
}

function is_post(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'POST' && get_string('action') === $action;
}

if (is_get('station_list')) {
	json([
		'station_list' => station_all(),
	]);
}

if (is_post('station_login')) {
	if (!station_code(post_int('station'), post_string('password')))
		json(NULL);
	json([
		'team_list' => team_all(),
		'player_list' => player_all(),
	]);
}

// TODO game GET

// TODO declare success & possible neutralization or conquest POST who, where