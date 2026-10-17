<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cron;

enum TestTaskKind: string
{
    case First = 'first';
    case Second = 'second';
}
