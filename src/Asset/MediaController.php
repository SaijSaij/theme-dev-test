<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Asset;

use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Asset\MediaLibrary;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\Capability;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;

/**
 * Imports an asset of the theme into the media library (assets.spec.js).
 */
#[RestController(Api::VERSION, base: '/assets')]
final readonly class MediaController
{
    public function __construct(private MediaLibrary $media) {}

    /**
     * @return array{id: int}
     */
    #[RestRoute('/media', HttpMethod::Post, new Capability('upload_files'))]
    public function import(string $name): array
    {
        return ['id' => $this->media->import($name)];
    }
}
