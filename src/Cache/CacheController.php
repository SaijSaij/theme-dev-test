<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Cache\Cache;
use Saij\WpAppFramework\Cache\CacheStore;
use Saij\WpAppFramework\Cache\Vary\UserVary;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\Capability;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;
use Saij\WpAppFramework\Value\ListOf;

/**
 * Cached routes, CacheStore::remember() and the controls of cache.spec.js (forced backends, invalidation).
 */
#[RestController(Api::NAMESPACE, base: '/cache')]
final readonly class CacheController
{
    public function __construct(
        private CacheStore $cache,
        private Counter $counter,
    ) {}

    /**
     * @return array{label: string, count: int, user: int}
     */
    #[RestRoute('/counted', HttpMethod::Get, new PublicAccess())]
    #[Cache(ttl: 300, tags: [Feed::Stats], vary: [new UserVary()])]
    public function counted(string $label = ''): array
    {
        return ['label' => $label, 'count' => $this->counter->next('counted'), 'user' => get_current_user_id()];
    }

    /**
     * One entry for all users: the permission check must still run for each request.
     *
     * @return array{count: int}
     */
    #[RestRoute('/protected', HttpMethod::Get, new Capability('edit_posts'))]
    #[Cache(ttl: 300, tags: [Feed::Stats])]
    public function protected(): array
    {
        return ['count' => $this->counter->next('protected')];
    }

    /**
     * @return array{count: int}
     */
    #[RestRoute('/remembered', HttpMethod::Get, new PublicAccess())]
    public function remembered(): array
    {
        return ['count' => $this->cache->remember('remembered', fn(): int => $this->counter->next('remembered'), 300, [Feed::Stats])];
    }

    /**
     * @return array{backend: string|null, objectCache: bool}
     */
    #[RestRoute('/state', HttpMethod::Get, new Capability('manage_options'))]
    public function state(): array
    {
        return ['backend' => $this->cache->getBackendName(), 'objectCache' => wp_using_ext_object_cache() === true];
    }

    /**
     * @param list<Backend> $backends
     */
    #[RestRoute('/backends', HttpMethod::Put, new Capability('manage_options'))]
    public function setBackends(#[ListOf(Backend::class)] array $backends): void
    {
        update_option(BackendFilter::OPTION, array_map(static fn(Backend $backend): string => $backend->value, $backends), false);
    }

    #[RestRoute('/backends', HttpMethod::Delete, new Capability('manage_options'))]
    public function resetBackends(): void
    {
        delete_option(BackendFilter::OPTION);
    }

    #[RestRoute('/invalidate', HttpMethod::Post, new Capability('manage_options'))]
    public function invalidate(): void
    {
        $this->cache->invalidate(Feed::Stats);
    }
}
