<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cron;

enum TestTaskKind: string
{
    case First = 'first';
    case Second = 'second';
}
