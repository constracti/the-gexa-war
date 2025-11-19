<?php

function json(mixed $array): void {
	header('content-type: application/json; charset=utf-8');
	exit(json_encode($array));
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

// TODO function post_int(string $key): ?int {}

function is_get(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'GET' && get_string('action') === $action;
}

function is_post(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'POST' && get_string('action') === $action;
}

if (is_get('station_list')) {
	json([
		'station_list' => [
			['id' => 1, 'name' => 'Station A'],
			['id' => 2, 'name' => 'Station B'],
			['id' => 3, 'name' => 'Station C'],
			['id' => 4, 'name' => 'Station D'],
			['id' => 5, 'name' => 'Station E'],
		],
	]);
}

// TODO station login POST where, password
if (is_post('station_login')) {
	if (post_string('password') !== 'asdf') {
		exit('password');
	}
	json([
		'team_list' => [
			['id' => 1, 'name' => 'Team A'],
			['id' => 2, 'name' => 'Team B'],
		],
		'player_list' => [
			['id' => 1, 'name' => 'Player A', 'team' => 1],
			['id' => 2, 'name' => 'Player B', 'team' => 1],
			['id' => 3, 'name' => 'Player C', 'team' => 2],
		],
	]);
}

// TODO game GET

// TODO declare success & possible neutralization or conquest POST who, where