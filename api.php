<?php

require_once 'config.php';
require_once 'dt.php';

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

// config

function config_get_int(string $name, int $default): int {
	global $db;
	$stmt = $db->prepare('SELECT `value` FROM `config` WHERE `name` = ?');
	$stmt->bind_param('s', $name);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	if (is_null($item))
		return $default;
	$value = unserialize($item['value']);
	return $value;
}

function config_set_int(string $name, int $value): void {
	$value = serialize($value);
	global $db;
	$stmt = $db->prepare('REPLACE INTO `config` (`name`, `value`) VALUES (?, ?)');
	$stmt->bind_param('ss', $name, $value);
	$stmt->execute();
	$stmt->close();
}

function config_get_deadline(): DT {
	$deadline = config_get_int('deadline', time());
	return DT::from_int($deadline);
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

function station_matches(int $id, string $code): bool {
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

function player_exists(string $id): bool {
	global $db;
	$stmt = $db->prepare('SELECT `id` FROM `player` WHERE `id` = ?');
	$stmt->bind_param('s', $id);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	return !is_null($item);
}

function player_points(): array {
	global $db;
	$stmt = $db->prepare('
	SELECT `player`.`id`, `player`.`name`, `player`.`team`, COUNT(`success`.`id`) AS `points` FROM `player`
	LEFT JOIN `success` ON `success`.`player` = `player`.`id`
	GROUP BY `player`.`id`, `player`.`name`, `player`.`team`
	ORDER BY `player`.`name` ASC, `player`.`id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

// success

function success_insert(int $station, string $player, string $type): void {
	$dt = new DateTimeImmutable();
	$dt = new DT($dt);
	$dt = $dt->to_sql();
	global $db;
	$stmt = $db->prepare('INSERT INTO `success` (`station`, `player`, `type`, `dt`) VALUES (?, ?, ?, ?)');
	$stmt->bind_param('isss', $station, $player, $type, $dt);
	$stmt->execute();
	$stmt->close();
}

// api

function json(mixed $mixed): void {
	header('content-type: application/json; charset=utf-8');
	exit(json_encode($mixed));
}

function get_string_nullable(string $key): ?string {
	if (!isset($_GET[$key]))
		return NULL;
	$value = $_GET[$key];
	if (!is_string($value))
		return NULL;
	return $value;
}

function post_string(string $key): string {
	if (!isset($_POST[$key]))
		exit($key);
	$value = $_POST[$key];
	if (!is_string($value))
		exit($key);
	return $value;
}

function post_int(string $key): int {
	$value = post_string($key);
	if (is_null($value))
		exit($key);
	$value = filter_var($value, FILTER_VALIDATE_INT);
	if ($value === FALSE)
		exit($key);
	return $value;
}

function is_get(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'GET' && get_string_nullable('action') === $action;
}

function is_post(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'POST' && get_string_nullable('action') === $action;
}

if (is_post('admin_login')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		json(NULL);
	json([
		'deadline' => config_get_deadline()->to_js(),
		'reward_success' => config_get_int('reward_success', 1),
		'reward_conquest' => config_get_int('reward_conquest', 1),
	]);
}

if (is_post('admin_config')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$deadline = post_string('deadline');
	$deadline = DT::from_js($deadline);
	$reward_success = post_int('reward_success');
	$reward_conquest = post_int('reward_conquest');
	config_set_int('deadline', $deadline->to_int());
	config_set_int('reward_success', $reward_success);
	config_set_int('reward_conquest', $reward_conquest);
	json(NULL);
}

if (is_get('station_list')) {
	json([
		'station_list' => station_all(),
	]);
}

if (is_post('station_login')) {
	$station = post_int('station');
	$password = post_string('password');
	if (!station_matches($station, $password))
		json(NULL);
	json([
		'deadline' => config_get_deadline()->to_sql(),
		'team_list' => team_all(),
		'player_list' => player_all(),
	]);
}

if (is_post('player_success')) {
	// TODO check deadline
	$station = post_int('station');
	$password = post_string('password');
	if (!station_matches($station, $password))
		exit('credentials');
	$type = post_string('type');
	if (!in_array($type, ['simple', 'neutralization', 'conquest'], TRUE))
		exit('type');
	$player = post_string('player');
	if (!player_exists($player))
		exit('player');
	success_insert($station, $player, $type);
	json(NULL); // TODO return deadline
}

if (is_get('game')) {
	json([
		'station_list' => station_all(),
		'team_list' => team_all(),
		'player_list' => player_all(),
	]);
}

if (is_get('player_points')) {
	json([
		'team_list' => team_all(),
		'player_list' => player_points(),
	]);
}