<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Rest;

use WebCodingCat\WpAppFramework\DependencyInjection\NoService;

#[NoService]
final class Api
{
    public const string VERSION = 'v1';
}
