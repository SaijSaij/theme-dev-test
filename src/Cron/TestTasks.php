<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cron;

use WebCodingCat\WpAppFramework\Cron\CronTask;

final readonly class TestTasks
{
    #[CronTask('test-task')]
    public function run(TestTask $task, CronCounter $counter): void
    {
        $counter->recordTask($task);
    }
}
