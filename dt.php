<?php


class DT {

	private const string SQL = 'Y-m-d H:i:s';
	private const string JS = 'Y-m-d\TH:i';

	public DateTimeImmutable $dt;

	private static function timezone(): DateTimeZone {
		return new DateTimeZone(TIMEZONE);
	}

	function __construct(DateTimeImmutable $dt) {
		$this->dt = $dt;
	}

	static function from_now(): DT {
		return DT::from_int(time());
	}

	static function from_int(int $int): DT {
		$dt = new DateTime();
		$dt->setTimestamp($int);
		$dt->setTimezone(DT::timezone());
		$dt = DateTimeImmutable::createFromMutable($dt);
		return new DT($dt);
	}

	static function from_js(string $js): DT {
		$dt = DateTimeImmutable::createFromFormat(DT::JS, $js, DT::timezone());
		if ($dt === FALSE)
			exit('DT::from_js');
		return new DT($dt);
	}

	static function from_sql(string $sql): DT {
		$dt = DateTimeImmutable::createFromFormat(DT::SQL, $sql, DT::timezone());
		if ($dt === FALSE)
			exit('DT::from_sql');
		return new DT($dt);
	}

	function to_int(): int {
		return $this->dt->getTimestamp();
	}

	function to_js(): string {
		return $this->dt->format(DT::JS);
	}

	function to_sql(): string {
		return $this->dt->format(DT::SQL);
	}
}
