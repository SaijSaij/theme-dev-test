<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Block\Image;
use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\RichText;
use Saij\WpAppFramework\Post\PostMeta;
use Saij\WpAppFramework\Value\ListOf;
use Saij\WpAppFramework\Value\Url;

/**
 * Meta of events with every kind of value, private fields with getters and setters.
 */
#[PostMeta('details', title: 'Event details', postTypes: [Event::class])]
final class EventDetails
{
    /**
     * @param list<Ticket> $tickets
     */
    public function __construct(
        #[Label('Start')]
        private string $start = '',
        private int $capacity = 0,
        private EventKind $kind = EventKind::Concert,
        private ?Venue $venue = null,
        #[ListOf(Ticket::class)]
        private array $tickets = [],
        #[RichText(allowedFormats: ['core/bold', 'core/link'])]
        private string $note = '',
        #[Image]
        private ?int $photo = null,
        #[Url]
        private string $website = '',
    ) {}

    public function getStart(): string
    {
        return $this->start;
    }

    public function setStart(string $start): void
    {
        $this->start = $start;
    }

    public function getCapacity(): int
    {
        return $this->capacity;
    }

    public function setCapacity(int $capacity): void
    {
        $this->capacity = $capacity;
    }

    public function getKind(): EventKind
    {
        return $this->kind;
    }

    public function setKind(EventKind $kind): void
    {
        $this->kind = $kind;
    }

    public function getVenue(): ?Venue
    {
        return $this->venue;
    }

    public function setVenue(?Venue $venue): void
    {
        $this->venue = $venue;
    }

    /**
     * @return list<Ticket>
     */
    public function getTickets(): array
    {
        return $this->tickets;
    }

    /**
     * @param list<Ticket> $tickets
     */
    public function setTickets(array $tickets): void
    {
        $this->tickets = $tickets;
    }

    public function getNote(): string
    {
        return $this->note;
    }

    public function setNote(string $note): void
    {
        $this->note = $note;
    }

    public function getPhoto(): ?int
    {
        return $this->photo;
    }

    public function getWebsite(): string
    {
        return $this->website;
    }

    public function setWebsite(string $website): void
    {
        $this->website = $website;
    }
}
