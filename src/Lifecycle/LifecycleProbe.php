<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Lifecycle;

use Saij\WpAppFramework\Lifecycle\OnActivation;
use Saij\WpAppFramework\Lifecycle\OnDeactivation;

/**
 * Counts activations and deactivations of the theme in the option theme_dev_test_lifecycle_probe, which
 * theme-dev-test/tests/lifecycle/run reads and deletes.
 */
final readonly class LifecycleProbe
{
    public const string OPTION = 'theme_dev_test_lifecycle_probe';

    #[OnActivation]
    public function activated(): void
    {
        $this->count('activation');
    }

    #[OnDeactivation]
    public function deactivated(): void
    {
        $this->count('deactivation');
    }

    private function count(string $phase): void
    {
        $counts = get_option(self::OPTION, []);
        $counts = is_array($counts) ? $counts : [];
        $previous = $counts[$phase] ?? 0;
        $counts[$phase] = (is_int($previous) ? $previous : 0) + 1;
        update_option(self::OPTION, $counts, false);
    }
}
