<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Hero;

use WebCodingCat\WpAppFramework\Value\Labeled;

/**
 * The icons of hero badges; the template draws them as inline SVG from path().
 */
enum BadgeIcon: string implements Labeled
{
    case Star = 'star';
    case Check = 'check';
    case Clock = 'clock';

    public function label(): string
    {
        return match ($this) {
            self::Star => 'Star',
            self::Check => 'Check',
            self::Clock => 'Clock',
        };
    }

    /**
     * The path of the icon in a 24 × 24 view box.
     */
    public function path(): string
    {
        return match ($this) {
            self::Star => 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z',
            self::Check => 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z',
            self::Clock => 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.1.8-1.2-4.5-2.7z',
        };
    }
}
