<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

/**
 * A value class in a list of meta: replaced as a whole, not changed.
 */
final readonly class Ticket
{
    public function __construct(
        public string $label,
        public float $price = 0.0,
    ) {}
}
