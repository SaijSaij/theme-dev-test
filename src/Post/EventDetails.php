<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Post\PostMeta;
use WebCodingCat\WpAppFramework\Value\DateTime;
use WebCodingCat\WpAppFramework\Value\Image;
use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\Link;
use WebCodingCat\WpAppFramework\Value\ListOf;
use WebCodingCat\WpAppFramework\Value\RichText;
use WebCodingCat\WpAppFramework\Value\Url;

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
        #[DateTime]
        #[Label('End')]
        private string $end = '',
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
        private Link $registration = new Link(),
    ) {}

    public function getStart(): string
    {
        return $this->start;
    }

    public function setStart(string $start): void
    {
        $this->start = $start;
    }

    public function getEnd(): string
    {
        return $this->end;
    }

    public function setEnd(string $end): void
    {
        $this->end = $end;
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

    public function getRegistration(): Link
    {
        return $this->registration;
    }

    public function setRegistration(Link $registration): void
    {
        $this->registration = $registration;
    }
}
