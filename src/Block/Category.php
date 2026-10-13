<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block;

use Saij\WpAppFramework\Block\CustomBlockCategory;

/**
 * Block categories of the theme, shown before those of WordPress in the inserter (containers.spec.js).
 */
enum Category: string implements CustomBlockCategory
{
    case Sections = 'sections';
    case Components = 'components';

    public function label(): string
    {
        return match ($this) {
            self::Sections => 'Dev test sections',
            self::Components => 'Dev test components',
        };
    }

    public function icon(): ?string
    {
        return $this === self::Sections ? 'layout' : null;
    }
}
