<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use DateTimeImmutable;
use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Post\AbstractPost;
use Saij\WpAppFramework\Post\Category;
use Saij\WpAppFramework\Post\Page;
use Saij\WpAppFramework\Post\Post;
use Saij\WpAppFramework\Post\PostFormat;
use Saij\WpAppFramework\Post\PostStatus;
use Saij\WpAppFramework\Post\Tag;
use Saij\WpAppFramework\Query\Any;
use Saij\WpAppFramework\Query\Comparison;
use Saij\WpAppFramework\Query\Direction;
use Saij\WpAppFramework\Query\DiscussionStatus;
use Saij\WpAppFramework\Query\PostOrder;
use Saij\WpAppFramework\Query\SearchColumn;
use Saij\WpAppFramework\Query\Terms;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\Capability;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;

/**
 * Runs queries of post objects on the posts a test created (`ids`, comma-separated), so other content of the site
 * does not count, and changes a meta value past WordPress' hooks (to see a cached result).
 */
#[RestController(Api::VERSION, base: '/queries')]
final readonly class QueryController
{
    /**
     * @return array{ids: list<int|null>, total: int, pages: int}
     */
    #[RestRoute('/run', HttpMethod::Get, new Capability('edit_posts'))]
    public function run(QueryCase $case, string $ids): array
    {
        $ids = array_map(intval(...), array_filter(explode(',', $ids), is_numeric(...)));
        $events = Event::query()->ids(...$ids)->orderBy(PostOrder::Id);
        if ($case === QueryCase::Page) {
            $page = Event::query()->ids(...$ids)->orderBy(PostOrder::Title)->paginate(perPage: 2, page: 2);

            return ['ids' => self::ids($page->getPosts()), 'total' => $page->getTotal(), 'pages' => $page->getPageCount()];
        }

        $query = match ($case) {
            QueryCase::CapacityOver10 => $events->where(EventDetailsFields::capacity()->greaterThan(10)),
            // Events without a stored capacity have the default 0.
            QueryCase::CapacityUnder5 => $events->where(EventDetailsFields::capacity()->lessThan(5)),
            QueryCase::TalkOrVenue => $events->where(Any::of(EventDetailsFields::kind()->equals(EventKind::Talk), EventDetailsFields::venue()->isNotNull())),
            QueryCase::WithGenre => $events->where(Terms::exists(Genre::class)),
            QueryCase::WithoutGenre => $events->where(Terms::notExists(Genre::class)),
            QueryCase::ByCapacity => Event::query()->ids(...$ids)->orderBy(EventDetailsFields::capacity(), Direction::Desc)->orderBy(PostOrder::Title),
            QueryCase::ByStart => Event::query()->ids(...$ids)->orderBy(EventDetailsFields::start())->orderBy(PostOrder::Title),
            QueryCase::Drafts => $events->status(PostStatus::Draft),
            QueryCase::Search => $events->search('Moonlight'),
            QueryCase::Cached => $events->where(EventDetailsFields::capacity()->greaterThan(10))->cache(600),
            QueryCase::Featured => Post::query()->ids(...$ids)->orderBy(PostOrder::Id)->where(ExtrasFields::featured()->equals(true)),
        };

        return ['ids' => self::ids($query->get()), 'total' => $query->count(), 'pages' => 1];
    }

    /**
     * Queries of posts and pages of WordPress by their standard fields, on the posts and pages a test created.
     * `term` is a category, tag or parent page, depending on the case.
     *
     * @return array{ids: list<int|null>}
     */
    #[RestRoute('/standard', HttpMethod::Get, new Capability('edit_posts'))]
    public function standard(StandardCase $case, string $ids, int $term = 0): array
    {
        $ids = array_map(intval(...), array_filter(explode(',', $ids), is_numeric(...)));
        $posts = Post::query()->ids(...$ids)->orderBy(PostOrder::Id);
        $pages = Page::query()->ids(...$ids)->orderBy(PostOrder::Id);

        $query = match ($case) {
            StandardCase::Category => $posts->where(Terms::in(Category::class, [$term])),
            StandardCase::Tag => $posts->where(Terms::notIn(Tag::class, [$term])),
            StandardCase::Slug => $pages->slug('e2e-imprint'),
            StandardCase::Title => $posts->title('E2E Blue moon'),
            StandardCase::ModifiedAfter => $posts->modifiedAfter(new DateTimeImmutable('-1 day')),
            StandardCase::ModifiedBefore => $posts->modifiedBefore(new DateTimeImmutable('2000-01-01')),
            StandardCase::ParentIn => $pages->parentIn($term),
            StandardCase::Template => $pages->template('page-wide'),
            StandardCase::DefaultTemplate => $pages->defaultTemplate(),
            StandardCase::Video => $posts->format(PostFormat::Video),
            StandardCase::Standard => $posts->format(PostFormat::Standard),
            StandardCase::Sticky => $posts->sticky(),
            StandardCase::NotSticky => $posts->sticky(false),
            StandardCase::Password => $pages->hasPassword(),
            StandardCase::MenuOrder => $pages->menuOrder(2),
            StandardCase::Commented => $posts->commentCount(1, Comparison::GreaterOrEqual),
            StandardCase::CommentsClosed => $posts->commentStatus(DiscussionStatus::Closed),
            StandardCase::SearchTitle => $posts->search('moon', columns: [SearchColumn::Title]),
            StandardCase::SearchPhrase => $posts->search('moon river', sentence: true),
        };

        return ['ids' => self::ids($query->get())];
    }

    /**
     * Writes the capacity of an event straight into the database, past the hooks that invalidate cached queries.
     */
    #[RestRoute('/unnoticed/{id}', HttpMethod::Post, new Capability('manage_options'))]
    public function unnoticed(int $id, int $capacity): void
    {
        $wpdb = $GLOBALS['wpdb'] ?? null;
        if (!$wpdb instanceof \wpdb) {
            throw new \LogicException('No database.');
        }
        $wpdb->update($wpdb->postmeta, ['meta_value' => (string) $capacity], ['post_id' => $id, 'meta_key' => 'dev_test_capacity']);
        wp_cache_delete($id, 'post_meta');
    }

    /**
     * @param list<AbstractPost> $posts
     * @return list<int|null>
     */
    private static function ids(array $posts): array
    {
        return array_map(static fn(AbstractPost $post): ?int => $post->getId(), $posts);
    }
}
