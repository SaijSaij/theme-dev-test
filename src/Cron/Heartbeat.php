<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cron;

use Saij\WpAppFramework\Cron\CronEvent;
use Saij\WpAppFramework\Cron\CronInterval;
use Saij\WpAppFramework\Cron\Weekday;

/**
 * Recurring events: an interval in seconds, a daily and a weekly event with a start time.
 */
final readonly class Heartbeat
{
    #[CronEvent('heartbeat', 3600)]
    public function beat(CronCounter $counter): void
    {
        $counter->count('heartbeat');
    }

    #[CronEvent('nightly', CronInterval::Daily, at: '03:00')]
    public function nightly(CronCounter $counter): void
    {
        $counter->count('nightly');
    }

    #[CronEvent('weekly', CronInterval::Weekly, at: '08:00', weekday: Weekday::Monday)]
    public function weekly(CronCounter $counter): void
    {
        $counter->count('weekly');
    }
}
