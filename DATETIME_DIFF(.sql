DATETIME_DIFF(
  DATETIME(
    YEAR(date), MONTH(date), DAY(date),
    HOUR(end_time), MINUTE(end_time), 0
  ),
  DATETIME(
    YEAR(date), MONTH(date), DAY(date),
    HOUR(start_time), MINUTE(start_time), 0
  ),
  MINUTE
) / 60