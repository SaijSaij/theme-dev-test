<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Setting;

/**
 * A nullable value class.
 */
final readonly class Contact
{
    public function __construct(
        public string $name = '',
        public string $email = '',
    ) {}
}
