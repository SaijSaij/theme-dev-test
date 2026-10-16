<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Rule;

final readonly class RuleAttributes
{
    public function __construct(
        public bool $thick = false,
    ) {}
}
