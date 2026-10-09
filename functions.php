<?php

declare(strict_types=1);

// Release builds ship prefixed dependencies in vendor-prefixed/; source checkouts use Composer's vendor/.
require is_file(__DIR__ . '/vendor-prefixed/autoload.php')
    ? __DIR__ . '/vendor-prefixed/autoload.php'
    : __DIR__ . '/vendor/autoload.php';

Saij\WpAppFramework\Theme::boot();
