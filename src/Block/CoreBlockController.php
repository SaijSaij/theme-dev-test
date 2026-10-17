<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block;

use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Block\CoreBlock;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WP_Block_Type_Registry;

/**
 * The cases of CoreBlock next to the core blocks WordPress registers, so containers.spec.js notices new or
 * removed core blocks of a WordPress version.
 */
#[RestController(Api::VERSION, base: '/core-blocks')]
final class CoreBlockController
{
    /**
     * @return array{enum: list<string>, registered: list<string>}
     */
    #[RestRoute('', HttpMethod::Get, new PublicAccess())]
    public function compare(): array
    {
        $enum = array_map(static fn(CoreBlock $block): string => $block->value, CoreBlock::cases());
        $registered = array_values(array_filter(
            array_keys(WP_Block_Type_Registry::get_instance()->get_all_registered()),
            static fn(string $name): bool => str_starts_with($name, 'core/'),
        ));
        sort($enum);
        sort($registered);

        return ['enum' => $enum, 'registered' => $registered];
    }
}
