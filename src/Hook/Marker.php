<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Hook;

use Saij\WpAppFramework\DependencyInjection\NoService;

/**
 * Passed to the filter as a WordPress argument; #[NoService] keeps it out of the container.
 */
#[NoService]
final readonly class Marker
{
    public function __construct(private string $name) {}

    public function getName(): string
    {
        return $this->name;
    }
}
