<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Twig;

use Saij\WpAppFramework\Twig\TemplateFilter;
use Saij\WpAppFramework\Twig\TemplateFunction;

/**
 * Template function and HTML filter; counts its instances to show that the
 * service is created only when a template calls it.
 */
final class TextHelpers
{
    private static int $instances = 0;

    public function __construct()
    {
        ++self::$instances;
    }

    public static function getInstances(): int
    {
        return self::$instances;
    }

    #[TemplateFunction('dev_test_greeting')]
    public function greeting(string $name): string
    {
        return 'Hello ' . $name;
    }

    #[TemplateFilter('dev_test_emphasize', html: true)]
    public function emphasize(string $value): string
    {
        return '<em>' . $value . '</em>';
    }
}
