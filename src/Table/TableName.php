<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Table;

/**
 * The tables of the theme, for TableController::schema().
 */
enum TableName: string
{
    case Log = 'log';
    case UpgradeProbe = 'upgrade-probe';
}
