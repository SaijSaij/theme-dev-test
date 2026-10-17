<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Post\PostMeta;
use WebCodingCat\WpAppFramework\Value\Link;

/**
 * Meta of the data type, edited in a meta box on the classic edit screen.
 */
#[PostMeta('place', title: 'Place', postTypes: [Venue::class])]
final class VenueDetails
{
    public function __construct(
        private string $address = '',
        private int $seats = 0,
        private Link $booking = new Link(),
    ) {}

    public function getAddress(): string
    {
        return $this->address;
    }

    public function getSeats(): int
    {
        return $this->seats;
    }

    public function getBooking(): Link
    {
        return $this->booking;
    }
}
