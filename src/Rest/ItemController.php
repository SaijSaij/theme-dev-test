<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Rest;

use RuntimeException;
use WebCodingCat\WpAppFramework\Rest\Format;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Param;
use WebCodingCat\WpAppFramework\Rest\Permission\Callback;
use WebCodingCat\WpAppFramework\Rest\Permission\Capability;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestException;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Routes covering argument handling, status codes and permissions.
 */
#[RestController(Api::VERSION, base: '/items')]
final class ItemController
{
    /** ID that the permission callback of update() refuses. */
    public const int LOCKED_ID = 13;

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('', HttpMethod::Get, new PublicAccess())]
    public function index(
        #[Param(minimum: 1, maximum: 10)]
        int $count = 1,
        bool $flag = false,
        Variant $variant = Variant::Short,
        #[Param(format: Format::Email)]
        ?string $email = null,
        #[Param(maxLength: 5)]
        string $code = '',
        float $ratio = 0.5,
        #[Param(minLength: 2, pattern: '^[a-z]+$')]
        string $slug = 'ab',
    ): array {
        return [
            'count' => $count,
            'flag' => $flag,
            'variant' => $variant->value,
            'email' => $email,
            'code' => $code,
            'ratio' => $ratio,
            'slug' => $slug,
        ];
    }

    /**
     * @return array<string, string>
     */
    #[RestRoute('/request', HttpMethod::Get, new PublicAccess())]
    public function request(WP_REST_Request $request): array
    {
        return ['class' => $request::class, 'route' => $request->get_route()];
    }

    #[RestRoute('/variant/{variant}', HttpMethod::Get, new PublicAccess())]
    public function variant(Variant $variant): string
    {
        return $variant->value;
    }

    #[RestRoute('', HttpMethod::Post, new PublicAccess())]
    public function create(#[Param(maxLength: 20)] string $title): WP_REST_Response
    {
        return new WP_REST_Response(['title' => $title], 201);
    }

    /**
     * @return array<string, int>
     */
    #[RestRoute('/{id}', HttpMethod::Get, new PublicAccess())]
    public function show(int $id): array
    {
        return ['id' => $id];
    }

    /**
     * @return array<string, int>
     */
    #[RestRoute('/{id}', HttpMethod::Put, new Callback(self::canUpdate(...)))]
    public function update(int $id): array
    {
        return ['id' => $id];
    }

    #[RestRoute('/{id}', HttpMethod::Delete, new Capability('edit_posts'))]
    public function delete(int $id): void {}

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/missing/{slug}', HttpMethod::Get, new PublicAccess())]
    public function missing(string $slug): array
    {
        throw new RestException('dev_test_not_found', sprintf('No item "%s".', $slug), 404, ['slug' => $slug]);
    }

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/fail', HttpMethod::Get, new PublicAccess())]
    public function fail(): array
    {
        throw new RuntimeException('Intended failure of the test theme.');
    }

    public static function canUpdate(int $id): bool
    {
        return $id !== self::LOCKED_ID;
    }
}
