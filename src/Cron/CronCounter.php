<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cron;

/**
 * Records the runs of the cron events and the last task in the option theme_dev_test_cron_counts (cron.spec.js).
 */
final class CronCounter
{
    public const string OPTION = 'theme_dev_test_cron_counts';

    public function count(string $event): void
    {
        $counts = $this->getCounts();
        $counts[$event] = (is_int($counts[$event] ?? null) ? $counts[$event] : 0) + 1;
        update_option(self::OPTION, $counts, false);
    }

    public function recordTask(TestTask $task): void
    {
        $counts = $this->getCounts();
        $counts['task'] = ['id' => $task->id, 'kind' => $task->kind->value];
        update_option(self::OPTION, $counts, false);
    }

    /**
     * @return array<mixed>
     */
    public function getCounts(): array
    {
        $counts = get_option(self::OPTION, []);

        return is_array($counts) ? $counts : [];
    }

    public function reset(): void
    {
        delete_option(self::OPTION);
    }
}
