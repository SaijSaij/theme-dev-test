<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Table;

use DateTimeImmutable;
use DateTimeInterface;
use WebCodingCat\WpAppFramework\Table\AbstractRow;
use WebCodingCat\WpAppFramework\Table\Indexed;
use WebCodingCat\WpAppFramework\Table\Length;
use WebCodingCat\WpAppFramework\Table\PrimaryKey;
use WebCodingCat\WpAppFramework\Table\Table;
use WebCodingCat\WpAppFramework\Table\Text;

/**
 * A row of the table wp_dev_test_log: every column type, an index of its own, a unique index and an index of two
 * columns.
 */
#[Table('log')]
final class LogEntry extends AbstractRow
{
    public function __construct(
        #[PrimaryKey]
        private ?int $id = null,
        #[Indexed(group: 'level_created', position: 1)]
        private Level $level = Level::Info,
        #[Length(500)]
        private string $message = '',
        #[Text]
        private string $context = '',
        #[Indexed(unique: true)]
        private ?string $reference = null,
        private int $attempts = 0,
        private float $ratio = 0.0,
        private bool $flagged = false,
        #[Indexed]
        private ?int $postId = null,
        private ?Priority $priority = null,
        private ?DateTimeImmutable $handled = null,
        #[Indexed(group: 'level_created', position: 2)]
        private DateTimeImmutable $created = new DateTimeImmutable(),
    ) {}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLevel(): Level
    {
        return $this->level;
    }

    public function setLevel(Level $level): void
    {
        $this->level = $level;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function setMessage(string $message): void
    {
        $this->message = $message;
    }

    public function getCreated(): DateTimeImmutable
    {
        return $this->created;
    }

    /**
     * The values for a REST response.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'level' => $this->level->value,
            'message' => $this->message,
            'context' => $this->context,
            'reference' => $this->reference,
            'attempts' => $this->attempts,
            'ratio' => $this->ratio,
            'flagged' => $this->flagged,
            'postId' => $this->postId,
            'priority' => $this->priority?->value,
            'handled' => $this->handled?->format(DateTimeInterface::ATOM),
            'created' => $this->created->format(DateTimeInterface::ATOM),
        ];
    }
}
