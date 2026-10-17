<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cron;

/**
 * A one-time task (name test-task) with an ID and an enum.
 */
final readonly class TestTask
{
    public function __construct(
        public int $id,
        public TestTaskKind $kind = TestTaskKind::First,
    ) {}
}
