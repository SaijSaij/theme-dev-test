<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cli;

/**
 * Values of the option --mode of `wp dev-test check values`.
 */
enum CheckMode: string
{
    case Fast = 'fast';
    case Full = 'full';
}
