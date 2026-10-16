<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Repeater;

final readonly class RepeatListAttributes
{
    /**
     * @param string $ids IDs of the items, separated by commas (for Mixed: "kind:id", e.g. "events:3,genres:5").
     */
    public function __construct(
        public RepeatSource $source = RepeatSource::Events,
        public string $ids = '',
    ) {}
}
