<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Identifier;

use Saij\WpAppFramework\Value\ListOf;

final readonly class ChipsAttributes
{
    /**
     * @param list<Chip> $chips
     */
    public function __construct(
        #[ListOf(Chip::class, appender: true)]
        public array $chips = [],
    ) {}
}
