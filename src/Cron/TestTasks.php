<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cron;

use Saij\WpAppFramework\Cron\CronTask;

final readonly class TestTasks
{
    #[CronTask]
    public function run(TestTask $task, CronCounter $counter): void
    {
        $counter->recordTask($task);
    }
}
