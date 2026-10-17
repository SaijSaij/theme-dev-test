<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Identifier;

use WebCodingCat\WpAppFramework\Setting\SettingsGroup;
use WebCodingCat\WpAppFramework\Value\ListOf;

/**
 * Regions with identifiers (#[Identifier]) in a settings group: option dev_test_regions. The first region of the
 * default has a fixed identifier, the second gets one when the group is saved.
 */
#[SettingsGroup('regions', title: 'Regions', position: 30)]
final readonly class RegionSettings
{
    /**
     * @param list<Region> $regions
     */
    public function __construct(
        #[ListOf(Region::class)]
        public array $regions = [new Region('0a1b2c3d', 'Main'), new Region(name: 'Side')],
    ) {}
}
