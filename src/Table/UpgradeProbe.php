<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Table;

use WebCodingCat\WpAppFramework\Table\AbstractRow;
use WebCodingCat\WpAppFramework\Table\Indexed;
use WebCodingCat\WpAppFramework\Table\Length;
use WebCodingCat\WpAppFramework\Table\PrimaryKey;
use WebCodingCat\WpAppFramework\Table\RenamedFrom;
use WebCodingCat\WpAppFramework\Table\Table;

/**
 * A row of the table wp_dev_test_upgrade_probe, whose older schema TableController simulates: the column title was
 * called label, code was wider, rank had no index and there was another column.
 */
#[Table('upgrade_probe')]
final class UpgradeProbe extends AbstractRow
{
    public function __construct(
        #[PrimaryKey]
        private ?int $id = null,
        #[RenamedFrom('label')]
        private string $title = '',
        #[Length(100)]
        private string $code = '',
        #[Indexed]
        private int $rank = 0,
    ) {}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getRank(): int
    {
        return $this->rank;
    }
}
