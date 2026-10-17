<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Rest;

use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WebCodingCat\WpAppFramework\Value\ListOf;

/**
 * Lists of value objects and enums as request arguments.
 */
#[RestController(Api::VERSION, base: '/lists')]
final class ListController
{
    /**
     * @param list<Link>    $links
     * @param list<Variant> $variants
     * @return array<string, mixed>
     */
    #[RestRoute('', [HttpMethod::Get, HttpMethod::Post], new PublicAccess())]
    public function echo(
        #[ListOf(Link::class)]
        array $links = [],
        #[ListOf(Variant::class)]
        array $variants = [Variant::Long],
    ): array {
        return [
            'links' => array_map(static fn(Link $link): array => ['class' => $link::class, 'label' => $link->label, 'url' => $link->url], $links),
            'variants' => array_map(static fn(Variant $variant): string => $variant->value, $variants),
        ];
    }
}
