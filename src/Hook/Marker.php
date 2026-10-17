<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Hook;

use WebCodingCat\WpAppFramework\DependencyInjection\NoService;

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
