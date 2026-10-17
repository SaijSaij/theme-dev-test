<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Query\Field\BoolField;
use WebCodingCat\WpAppFramework\Query\MetaFields;

/**
 * Written by hand: only the field that queries use.
 */
#[MetaFields(Extras::class)]
final class ExtrasFields
{
    public static function featured(): BoolField
    {
        return new BoolField(Extras::class, 'featured');
    }
}
