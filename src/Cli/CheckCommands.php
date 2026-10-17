<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cli;

use RuntimeException;
use WebCodingCat\ThemeDevTest\Hook\Greeting;
use WebCodingCat\WpAppFramework\WpCli\Argument;
use WebCodingCat\WpAppFramework\WpCli\CliCommand;
use WebCodingCat\WpAppFramework\WpCli\CliException;
use WebCodingCat\WpAppFramework\WpCli\CliOutput;
use WebCodingCat\WpAppFramework\WpCli\CliSubcommand;
use WebCodingCat\WpAppFramework\WpCli\Option;

/**
 * WP-CLI commands `wp dev-test check …`, run by tests/cli/run.
 */
#[CliCommand('check', 'Commands that check the WP-CLI support of the framework.')]
final readonly class CheckCommands
{
    #[CliSubcommand('values', 'Print the converted values with their PHP types as JSON.', longDescription: "## EXAMPLES\n\n    wp dev-test check values hello 3 --mode=full --ratio=0.5 --upper")]
    public function values(
        CliOutput $output,
        #[Argument('Any text.')]
        string $text,
        #[Option('How to check.')]
        CheckMode $mode,
        #[Argument('A number.')]
        int $count = 1,
        #[Option('A ratio.')]
        ?float $ratio = null,
        #[Option('Print the text in upper case.')]
        bool $upper = false,
    ): void {
        $output->log((string) json_encode([
            'text' => [$upper ? strtoupper($text) : $text, get_debug_type($text)],
            'count' => [$count, get_debug_type($count)],
            'ratio' => [$ratio, get_debug_type($ratio)],
            'mode' => [$mode->value, 'CheckMode::' . $mode->name],
            'upper' => [$upper, get_debug_type($upper)],
        ]));
    }

    #[CliSubcommand('ids', 'Print the IDs with their PHP types as JSON.')]
    public function ids(CliOutput $output, #[Argument('IDs.')] int ...$ids): void
    {
        $output->log((string) json_encode(array_map(static fn(int $id): array => [$id, get_debug_type($id)], $ids)));
    }

    #[CliSubcommand('service', 'Print the message of an injected service.')]
    public function service(CliOutput $output, Greeting $greeting): void
    {
        $output->log($greeting->getMessage());
    }

    #[CliSubcommand('output', 'Write each kind of output.')]
    public function output(CliOutput $output): void
    {
        $output->log('A log line.');
        $output->warning('A warning.');
        $output->table([['name' => 'first', 'count' => 1], ['name' => 'second', 'count' => 2]], ['name', 'count']);
        $output->success('Done.');
    }

    #[CliSubcommand('fail', 'Fail with exit code 3.')]
    public function fail(): void
    {
        throw new CliException('Failed on purpose.', 3);
    }

    #[CliSubcommand('crash', 'Throw an unexpected exception.')]
    public function crash(): void
    {
        throw new RuntimeException('Crashed on purpose.');
    }
}
