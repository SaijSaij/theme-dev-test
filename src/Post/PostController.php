<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Post\Post;
use Saij\WpAppFramework\Post\PostStatus;
use Saij\WpAppFramework\Post\PostValidationException;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\Capability;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestException;
use Saij\WpAppFramework\Rest\RestRoute;

/**
 * Works with post objects in PHP: reads typed meta, changes and creates posts,
 * and stores raw meta values past the schema (to check the fallback of invalid values).
 */
#[RestController(Api::VERSION, base: '/posts')]
final readonly class PostController
{
    /**
     * The event with its meta as PHP types.
     *
     * @return array<string, mixed>
     */
    #[RestRoute('/events/{id}', HttpMethod::Get, new Capability('edit_posts'))]
    public function event(int $id): array
    {
        $event = Event::find($id) ?? throw new RestException('dev_test_no_event', 'No event.', 404);
        $details = $event->meta(EventDetails::class);

        return [
            'class' => $event::class,
            'title' => $event->getTitle(),
            'status' => $event->getStatus()->value,
            'start' => $details->getStart(),
            'capacity' => $details->getCapacity(),
            'kind' => $details->getKind()->value,
            'venue' => $details->getVenue() === null ? null : ['class' => $details->getVenue()::class, 'id' => $details->getVenue()->getId(), 'title' => $details->getVenue()->getTitle()],
            'tickets' => array_map(static fn(Ticket $ticket): array => ['label' => $ticket->label, 'price' => $ticket->price], $details->getTickets()),
            'note' => $details->getNote(),
            'photo' => $details->getPhoto(),
            'website' => $details->getWebsite(),
            'soldOut' => $event->isSoldOut(100),
        ];
    }

    /**
     * Creates an event with meta and a genre, in PHP.
     *
     * @return array{id: int|null}
     */
    #[RestRoute('/events', HttpMethod::Post, new Capability('edit_posts'))]
    public function create(string $title, int $capacity, int $venue = 0, int $genre = 0): array
    {
        $event = new Event();
        $event->setTitle($title);
        $event->setStatus(PostStatus::Publish);
        $details = $event->meta(EventDetails::class);
        $details->setCapacity($capacity);
        $details->setKind(EventKind::Talk);
        $details->setTickets([new Ticket('Standard', 15.5)]);
        $details->setNote('<strong>Bring a friend</strong>');
        if ($venue > 0) {
            $details->setVenue(Venue::get($venue));
        }
        if ($genre > 0) {
            $event->setTerms(Genre::class, [$genre]);
        }
        $event->save();

        return ['id' => $event->getId()];
    }

    /**
     * Changes meta values and saves; a reference to a venue that has not been saved yet is rejected without
     * writing anything.
     *
     * @return array{saved: bool, errors: list<string>}
     */
    #[RestRoute('/events/{id}', HttpMethod::Post, new Capability('edit_posts'))]
    public function change(int $id, int $capacity, string $website = '', string $title = '', bool $unsavedVenue = false): array
    {
        $event = Event::get($id);
        $details = $event->meta(EventDetails::class);
        $details->setCapacity($capacity);
        $details->setWebsite($website);
        if ($unsavedVenue) {
            $details->setVenue(new Venue());
        }
        if ($title !== '') {
            $event->setTitle($title);
        }
        try {
            $event->save();
        } catch (PostValidationException $exception) {
            return ['saved' => false, 'errors' => $exception->getErrors()];
        }

        return ['saved' => true, 'errors' => []];
    }

    /**
     * The extras of a post of WordPress.
     *
     * @return array{subtitle: string, featured: bool}
     */
    #[RestRoute('/posts/{id}/extras', HttpMethod::Get, new Capability('edit_posts'))]
    public function extras(int $id): array
    {
        $extras = Post::get($id)->meta(Extras::class);

        return ['subtitle' => $extras->getSubtitle(), 'featured' => $extras->isFeatured()];
    }

    /**
     * Stores a raw meta value past the schema, as other code could.
     */
    #[RestRoute('/raw/{id}', HttpMethod::Post, new Capability('manage_options'))]
    public function raw(int $id, string $key, string $value): void
    {
        update_post_meta($id, $key, $value);
    }
}
