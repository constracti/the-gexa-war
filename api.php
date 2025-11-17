<?php

function success(array $array): void {
	header('content-type: application/json; charset=utf-8');
	exit(json_encode($array));
}

// TODO game GET

// TODO station sign-in POST where, password

// TODO declare success & possible neutralization or conquest POST who, where
// TODO declare ticket POST who, which

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