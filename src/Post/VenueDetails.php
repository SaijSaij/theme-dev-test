<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Post\PostMeta;

/**
 * Meta of the data type, edited in a meta box on the classic edit screen.
 */
#[PostMeta('place', title: 'Place', postTypes: [Venue::class])]
final class VenueDetails
{
    public function __construct(
        private string $address = '',
        private int $seats = 0,
    ) {}

    public function getAddress(): string
    {
        return $this->address;
    }

    public function getSeats(): int
    {
        return $this->seats;
    }
}
