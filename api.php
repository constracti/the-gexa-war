<?php

$array = [
	'teams' => 5,
];

header('content-type: application/json; charset=utf-8');

exit(json_encode($array));