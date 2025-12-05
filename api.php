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

function config_get(string $name, mixed $default): mixed {
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

function config_set(string $name, mixed $value): void {
	$value = serialize($value);
	global $db;
	$stmt = $db->prepare('REPLACE INTO `config` (`name`, `value`) VALUES (?, ?)');
	$stmt->bind_param('ss', $name, $value);
	$stmt->execute();
	$stmt->close();
}

function config_get_game_start(): DT {
	$game_start = config_get('game_start', 0);
	return DT::from_int($game_start);
}

function config_get_game_stop(): DT {
	$game_stop = config_get('game_stop', 0);
	return DT::from_int($game_stop);
}

function config_get_reward_success(): int {
	return config_get('reward_success', 1);
}

function config_get_reward_conquest(): int {
	return config_get('reward_conquest', 1);
}

function config_get_reward_rate(): float {
	return config_get('reward_rate', 0.);
}

function get_game_state(DT $now, DT $game_start, DT $game_stop): string {
	if ($now->dt < $game_start->dt)
		return 'pending';
	if ($now->dt >= $game_stop->dt)
		return 'finished';
	return 'running';
}

// station

function station_list(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name`, `team` FROM `station` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

function station_with_code_list(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name`, `code`, `team` FROM `station` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

function station_exists(int $id): bool {
	global $db;
	$stmt = $db->prepare('SELECT `id` FROM `station` WHERE `id` = ?');
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	return !is_null($item);
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

function station_update(int $id, string $name, string $code, ?int $team): void {
	global $db;
	$stmt = $db->prepare('UPDATE `station` SET `name` = ?, `code` = ?, `team` = ? WHERE `id` = ?');
	$stmt->bind_param('ssii', $name, $code, $team, $id);
	$stmt->execute();
	$stmt->close();
}

// team

function team_list(): array {
	global $db;
	$stmt = $db->prepare('SELECT `id`, `name`, `color` FROM `team` ORDER BY `name` ASC, `id` ASC');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

function team_name_list(): array {
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

function team_with_players_list(): array {
	global $db;
	$stmt = $db->prepare('
	SELECT `team`.`id`, `team`.`name`, `team`.`color`, COUNT(`player`.`id`) AS `players`
	FROM `team`
	LEFT JOIN `player` ON `player`.`team` = `team`.`id`
	GROUP BY `team`.`id`, `team`.`name`
	ORDER BY `team`.`name` ASC, `team`.`id` ASC
	');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc()))
		$list[] = $item;
	$rslt->free();
	$stmt->close();
	return $list;
}

function team_exists(int $id): bool {
	global $db;
	$stmt = $db->prepare('SELECT `id` FROM `team` WHERE `id` = ?');
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	return !is_null($item);
}

function team_stations(int $id): ?int {
	global $db;
	$stmt = $db->prepare('SELECT COUNT(`id`) AS `stations` FROM `station` WHERE `team` = ?');
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	if (is_null($item))
		return NULL;
	return $item['stations'];
}

function team_players(int $id): ?int {
	global $db;
	$stmt = $db->prepare('SELECT COUNT(`id`) AS `players` FROM `player` WHERE `team` = ?');
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$rslt = $stmt->get_result();
	$item = $rslt->fetch_assoc();
	$rslt->free();
	$stmt->close();
	if (is_null($item))
		return NULL;
	return $item['players'];
}

function team_insert(string $name, string $color): void {
	global $db;
	$stmt = $db->prepare('INSERT INTO `team` (`name`, `color`) VALUES (?, ?)');
	$stmt->bind_param('ss', $name, $color);
	$stmt->execute();
	$stmt->close();
}

function team_update(int $id, string $name, string $color): void {
	global $db;
	$stmt = $db->prepare('UPDATE `team` SET `name` = ?, `color` = ? WHERE `id` = ?');
	$stmt->bind_param('ssi', $name, $color, $id);
	$stmt->execute();
	$stmt->close();
}

function team_delete(int $id): void {
	global $db;
	$stmt = $db->prepare('DELETE FROM `team` WHERE `id` = ?');
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$stmt->close();
}

// player

// TODO player active?

function player_list(): array {
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

function player_insert(string $id, string $name, int $team): void {
	global $db;
	$stmt = $db->prepare('INSERT INTO `player` (`id`, `name`, `team`) VALUES (?, ?, ?)');
	$stmt->bind_param('ssi', $id, $name, $team);
	$stmt->execute();
	$stmt->close();
}

function player_update(string $player, string $id, string $name, int $team): void {
	global $db;
	$stmt = $db->prepare('UPDATE `player` SET `id` = ?, `name` = ?, `team` = ? WHERE `id` = ?');
	$stmt->bind_param('ssis', $id, $name, $team, $player);
	$stmt->execute();
	$stmt->close();
}

function player_delete(string $id): void {
	global $db;
	$stmt = $db->prepare('DELETE FROM `player` WHERE `id` = ?');
	$stmt->bind_param('s', $id);
	$stmt->execute();
	$stmt->close();
}

// success

function success_with_team_list(DT $game_start, DT $game_stop): array {
	global $db;
	$stmt = $db->prepare('
	SELECT `success`.`id`, `success`.`station`, `player`.`team`, `success`.`type`, `success`.`dt` AS `timestamp`
	FROM `success`
	LEFT JOIN `player` ON `player`.`id` = `success`.`player`
	ORDER BY `timestamp` ASC, `success`.`id` ASC
	');
	$stmt->execute();
	$rslt = $stmt->get_result();
	$list = [];
	while (!is_null($item = $rslt->fetch_assoc())) {
		$timestamp = DT::from_sql($item['timestamp']);
		if (get_game_state($timestamp, $game_start, $game_stop) !== 'running')
			continue;
		$item['timestamp'] = $timestamp->to_int();
		$list[] = $item;
	}
	$rslt->free();
	$stmt->close();
	return $list;
}

function success_insert(int $station, string $player, string $type, DT $dt): void {
	global $db;
	$stmt = $db->prepare('INSERT INTO `success` (`station`, `player`, `type`, `dt`) VALUES (?, ?, ?, ?)');
	$stmt->bind_param('isss', $station, $player, $type, $dt->to_sql());
	$stmt->execute();
	$stmt->close();
}

// TODO success delete

// TODO success truncate

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
		exit($key);
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

function post_int_nullable(string $key): ?int {
	if (!isset($_POST[$key]))
		return NULL;
	$value = $_POST[$key];
	if (!is_string($value))
		exit($key);
	if (empty($value))
		return NULL;
	$value = filter_var($value, FILTER_VALIDATE_INT);
	if ($value === FALSE)
		exit($key);
	return $value;
}

function post_int(string $key): int {
	$value = post_string($key);
	$value = filter_var($value, FILTER_VALIDATE_INT);
	if ($value === FALSE)
		exit($key);
	return $value;
}

function post_float(string $key): float {
	$value = post_string($key);
	$value = filter_var($value, FILTER_VALIDATE_FLOAT);
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
		'game_start' => config_get_game_start()->to_js(),
		'game_stop' => config_get_game_stop()->to_js(),
		'reward_success' => config_get_reward_success(),
		'reward_conquest' => config_get_reward_conquest(),
		'reward_rate' => config_get_reward_rate(),
		'station_list'=> station_with_code_list(),
		'team_list' => team_list(),
		'player_list' => player_list(),
	]);
}

if (is_post('admin_config')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$game_start = post_string('game_start');
	$game_start = DT::from_js($game_start);
	$game_stop = post_string('game_stop');
	$game_stop = DT::from_js($game_stop);
	$reward_success = post_int('reward_success');
	$reward_conquest = post_int('reward_conquest');
	$reward_rate = post_float('reward_rate');
	config_set('game_start', $game_start->to_int());
	config_set('game_stop', $game_stop->to_int());
	config_set('reward_success', $reward_success);
	config_set('reward_conquest', $reward_conquest);
	config_set('reward_rate', $reward_rate);
	json(NULL);
}

if (is_post('station_update')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$id = post_int('id');
	if (!station_exists($id))
		exit('id');
	$name = post_string('name');
	$code = post_string('code');
	$team = post_int_nullable('team');
	if (!is_null($team) && !team_exists($team))
		exit('team');
	station_update($id, $name, $code, $team);
	json([
		'station_list' => station_with_code_list(),
	]);
}

if (is_post('team_insert')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$name = post_string('name');
	$color = post_string('color');
	team_insert($name, $color);
	json([
		'team_list' => team_list(),
	]);
}

if (is_post('team_update')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$id = post_int('id');
	if (!team_exists($id))
		exit('id');
	$name = post_string('name');
	$color = post_string('color');
	team_update($id, $name, $color);
	json([
		'team_list' => team_list(),
	]);
}

if (is_post('team_delete')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$id = post_int('id');
	if (!team_exists($id))
		exit('id');
	if (team_stations($id) !== 0)
		exit('id');
	if (team_players($id) !== 0)
		exit('id');
	team_delete($id);
	json([
		'team_list' => team_list(),
	]);
}

if (is_post('player_insert')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$id = post_string('id');
	if (player_exists($id))
		json(NULL);
	$name = post_string('name');
	$team = post_int('team');
	if (!team_exists($team))
		exit('team');
	player_insert($id, $name, $team);
	json([
		'player_list' => player_list(),
	]);
}

if (is_post('player_update')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$player = post_string('player');
	if (!player_exists($player))
		exit('player');
	$id = post_string('id');
	if ($id !== $player && player_exists($id))
		json(NULL);
	$name = post_string('name');
	$team = post_int('team');
	if (!team_exists($team))
		exit('team');
	player_update($player, $id, $name, $team);
	json([
		'player_list' => player_list(),
	]);
}

if (is_post('player_delete')) {
	$password = post_string('password');
	if ($password !== ADMIN_PASS)
		exit('password');
	$id = post_string('id');
	if (!player_exists($id))
		exit('id');
	player_delete($id);
	json([
		'player_list' => player_list(),
	]);
}

if (is_get('station_list')) {
	json([
		'station_list' => station_list(),
	]);
}

if (is_post('station_login')) {
	$station = post_int('station');
	$password = post_string('password');
	if (!station_matches($station, $password))
		json(NULL);
	$game_start = config_get_game_start();
	$game_stop = config_get_game_stop();
	$now = DT::from_now();
	json([
		'game_start' => $game_start->to_sql(),
		'game_stop' => $game_stop->to_sql(),
		'team_list' => team_name_list(),
		'player_list' => player_list(),
	]);
}

if (is_post('player_success')) {
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
	$game_start = config_get_game_start();
	$game_stop = config_get_game_stop();
	$now = DT::from_now();
	$game_state = get_game_state($now, $game_start, $game_stop);
	if ($game_state === 'running')
		success_insert($station, $player, $type, $now);
	json([
		'game_start' => $game_start->to_sql(),
		'game_stop' => $game_stop->to_sql(),
		'game_state' => $game_state,
	]);
}

if (is_get('game')) {
	$game_start = config_get_game_start();
	$game_stop = config_get_game_stop();
	$now = DT::from_now();
	$game_state = get_game_state($now, $game_start, $game_stop);
	if ($game_state === 'pending')
		$timestamp = $game_start->to_int();
	elseif ($game_state === 'finished')
		$timestamp = $game_stop->to_int();
	else
		$timestamp = $now->to_int();
	json([
		'game_start' => $game_start->to_sql(),
		'game_stop' => $game_stop->to_sql(),
		'game_state' => $game_state,
		'initial_timestamp' => $game_start->to_int(),
		'current_timestamp' => $timestamp,
		'reward_success' => config_get_reward_success(),
		'reward_conquest' => config_get_reward_conquest(),
		'reward_rate' => config_get_reward_rate(),
		'station_list' => station_list(),
		'team_list' => team_with_players_list(),
		'success_list' => success_with_team_list($game_start, $game_stop),
	]);
}

if (is_get('player_points')) { // TODO limit to admin
	json([
		'team_list' => team_name_list(),
		'player_list' => player_points(),
	]);
}

// TODO draw winners page