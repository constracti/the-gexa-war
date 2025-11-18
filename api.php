<?php

function success(array $array): void {
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

function is_get(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'GET' && get_string('action') === $action;
}

function is_post(string $action): bool {
	return $_SERVER['REQUEST_METHOD'] === 'POST' && get_string('action') === $action;
}

if (is_get('station_list')) {
	success([
		'station_list' => [
			'Αθήνα',
			'Κατερίνη',
			'Θεσσαλονίκη',
			'Πάτρα',
			'Σέρρες',
			'Τρίκαλα',
		],
	]);
}

// TODO station login POST where, password
if (is_post('station_login')) {
	success([
		'team_list' => [
			'Team A',
			'Team B',
		],
		'player_list' => [
			'Player A',
			'Player B',
			'Player C',
		],
	]);
}

// TODO game GET

// TODO declare success & possible neutralization or conquest POST who, where