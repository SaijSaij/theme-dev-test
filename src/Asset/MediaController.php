<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Asset;

use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Asset\MediaLibrary;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\Capability;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

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
