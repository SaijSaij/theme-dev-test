<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Table;

use DateTimeImmutable;
use DateTimeZone;
use LogicException;
use RuntimeException;
use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Query\All;
use Saij\WpAppFramework\Query\Any;
use Saij\WpAppFramework\Query\Direction;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\Capability;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestException;
use Saij\WpAppFramework\Rest\RestRoute;
use wpdb;

/**
 * Tables of the theme over REST: rows of LogEntry created, loaded, changed, restored with their ID and deleted, queries on the rows a test
 * created (`ids`, comma-separated), the structure of a table as the database reports it, and an older schema of
 * UpgradeProbe for the schema sync to bring up to date.
 */
#[RestController(Api::VERSION, base: '/tables')]
final readonly class TableController
{
    /**
     * The option in which the framework keeps the state of the schema sync; the tests make the sync run again by
     * changing its hash.
     */
    private const string SYNC_OPTION = 'theme_dev_test_tables';

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/entries', HttpMethod::Post, new Capability('manage_options'))]
    public function create(
        Level $level = Level::Info,
        string $message = '',
        string $context = '',
        string $reference = '',
        int $attempts = 0,
        float $ratio = 0.0,
        bool $flagged = false,
        int $postId = 0,
        int $priority = 0,
        string $handled = '',
        string $created = '',
    ): array {
        $entry = new LogEntry(
            level: $level,
            message: $message,
            context: $context,
            reference: $reference === '' ? null : $reference,
            attempts: $attempts,
            ratio: $ratio,
            flagged: $flagged,
            postId: $postId === 0 ? null : $postId,
            priority: Priority::tryFrom($priority),
            handled: $handled === '' ? null : new DateTimeImmutable($handled),
            created: $created === '' ? new DateTimeImmutable() : new DateTimeImmutable($created),
        );
        $entry->save();

        return $entry->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/entries/{id}', HttpMethod::Get, new Capability('manage_options'))]
    public function entry(int $id): array
    {
        return self::find($id)->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/entries/{id}', HttpMethod::Post, new Capability('manage_options'))]
    public function update(int $id, Level $level, string $message): array
    {
        $entry = self::find($id);
        $entry->setLevel($level);
        $entry->setMessage($message);
        $entry->save();

        return LogEntry::get($id)->toArray();
    }

    /**
     * Saves a new row object with the given primary key: it updates the row with that key or, if there is none,
     * inserts it with that key.
     *
     * @return array<string, mixed>
     */
    #[RestRoute('/entries/{id}', HttpMethod::Put, new Capability('manage_options'))]
    public function restore(int $id, Level $level, string $message, string $created): array
    {
        new LogEntry(id: $id, level: $level, message: $message, created: new DateTimeImmutable($created))->save();

        return LogEntry::get($id)->toArray();
    }

    /**
     * @return array{deleted: bool}
     */
    #[RestRoute('/entries/{id}', HttpMethod::Delete, new Capability('manage_options'))]
    public function delete(int $id): array
    {
        $entry = self::find($id);
        $entry->delete();

        return ['deleted' => $entry->getId() === null];
    }

    /**
     * @return array{ids: list<int|null>, count: int, first: int|null}
     */
    #[RestRoute('/query', HttpMethod::Get, new Capability('manage_options'))]
    public function query(TableCase $case, string $ids, string $reference = ''): array
    {
        $own = LogEntry::query()->where(LogEntryFields::id()->in(...self::ids($ids)));
        $query = match ($case) {
            TableCase::Errors => $own->where(LogEntryFields::level()->equals(Level::Error)),
            TableCase::ErrorOrRetried => $own->where(Any::of(
                LogEntryFields::level()->equals(Level::Error),
                All::of(LogEntryFields::attempts()->greaterThan(3), LogEntryFields::postId()->isNotNull()),
            )),
            // A row without reference is not equal to it either, like null !== $reference in PHP.
            TableCase::NotReference => $own->where(LogEntryFields::reference()->notEquals($reference)),
            TableCase::WithoutPost => $own->where(LogEntryFields::postId()->isNull()),
            TableCase::Recent => $own->orderBy(LogEntryFields::created(), Direction::Desc)->orderBy(LogEntryFields::id()),
            TableCase::Page => $own->orderBy(LogEntryFields::id())->limit(2)->offset(1),
            TableCase::Contains => $own->where(LogEntryFields::message()->contains('50%')),
            TableCase::HighPriority => $own->where(LogEntryFields::priority()->in(Priority::High)),
            TableCase::FirstHalf => $own->where(LogEntryFields::created()->between(new DateTimeImmutable('2026-01-01 00:00:00 UTC'), new DateTimeImmutable('2026-06-30 23:59:59 UTC'))),
            TableCase::FlaggedRatio => $own->where(LogEntryFields::flagged()->equals(true), LogEntryFields::ratio()->greaterThan(0.25)),
        };

        return [
            'ids' => array_map(static fn(LogEntry $entry): ?int => $entry->getId(), $query->get()),
            'count' => $query->count(),
            'first' => $query->first()?->getId(),
        ];
    }

    /**
     * Deletes the given rows created before the time, with one query.
     *
     * @return array{removed: int}
     */
    #[RestRoute('/purge', HttpMethod::Post, new Capability('manage_options'))]
    public function purge(string $ids, string $before): array
    {
        return ['removed' => LogEntry::query()
            ->where(LogEntryFields::id()->in(...self::ids($ids)), LogEntryFields::created()->lessThan(new DateTimeImmutable($before, new DateTimeZone('UTC'))))
            ->delete()];
    }

    /**
     * Inserts a row past the row class, with a level the enum does not have.
     *
     * @return array{id: int}
     */
    #[RestRoute('/invalid', HttpMethod::Post, new Capability('manage_options'))]
    public function invalid(): array
    {
        $wpdb = self::wpdb();
        if ($wpdb->insert(LogEntry::tableName(), ['level' => 'removed', 'message' => 'invalid', 'context' => '', 'created' => gmdate('Y-m-d H:i:s')]) === false) {
            throw new RuntimeException($wpdb->last_error);
        }

        return ['id' => $wpdb->insert_id];
    }

    /**
     * The columns and indexes of a table as the database reports them.
     *
     * @return array{name: string, columns: array<string, array{type: string, null: string, default: string|null}>, indexes: array<string, array{columns: list<string>, unique: bool}>}
     */
    #[RestRoute('/schema/{table}', HttpMethod::Get, new Capability('manage_options'))]
    public function schema(TableName $table): array
    {
        $wpdb = self::wpdb();
        $name = $table === TableName::Log ? LogEntry::tableName() : UpgradeProbe::tableName();
        $columns = [];
        foreach ((array) $wpdb->get_results($wpdb->prepare('DESCRIBE %i', $name), ARRAY_A) as $row) {
            /** @var array{Field: string, Type: string, Null: string, Default: string|null} $row As DESCRIBE returns it. */
            $columns[$row['Field']] = ['type' => $row['Type'], 'null' => $row['Null'], 'default' => $row['Default']];
        }
        $indexes = [];
        foreach ((array) $wpdb->get_results($wpdb->prepare('SHOW INDEX FROM %i', $name), ARRAY_A) as $row) {
            /** @var array{Key_name: string, Column_name: string, Non_unique: string} $row As SHOW INDEX returns it, by position. */
            $indexes[$row['Key_name']] ??= ['columns' => [], 'unique' => $row['Non_unique'] === '0'];
            $indexes[$row['Key_name']]['columns'][] = $row['Column_name'];
        }

        return ['name' => $name, 'columns' => $columns, 'indexes' => $indexes];
    }

    /**
     * @return array{title: string, code: string, rank: int}
     */
    #[RestRoute('/probe/{id}', HttpMethod::Get, new Capability('manage_options'))]
    public function probe(int $id): array
    {
        $probe = UpgradeProbe::find($id) ?? throw new RestException('dev_test_not_found', 'No such row.', 404);

        return ['title' => $probe->getTitle(), 'code' => $probe->getCode(), 'rank' => $probe->getRank()];
    }

    /**
     * Turns the table of UpgradeProbe into an older schema – an extra column, the column title under its earlier
     * name label, a wider code, no index on rank – inserts a row into it and makes the next request sync the tables.
     *
     * @return array{id: int}
     */
    #[RestRoute('/probe/simulate', HttpMethod::Post, new Capability('manage_options'))]
    public function simulate(string $title): array
    {
        $wpdb = self::wpdb();
        $table = UpgradeProbe::tableName();
        self::run($wpdb, $wpdb->prepare(
            "ALTER TABLE %i ADD COLUMN `legacy` varchar(20) NOT NULL DEFAULT '', CHANGE COLUMN `title` `label` varchar(191) NOT NULL DEFAULT '', MODIFY COLUMN `code` varchar(300) NOT NULL DEFAULT '', DROP INDEX `rank`",
            $table,
        ));
        if ($wpdb->insert($table, ['label' => $title, 'code' => 'c1', 'rank' => 1, 'legacy' => 'old']) === false) {
            throw new RuntimeException($wpdb->last_error);
        }
        $id = $wpdb->insert_id;
        $this->resync();

        return ['id' => $id];
    }

    /**
     * Adds a column to the table of UpgradeProbe without making the next request sync the tables.
     */
    #[RestRoute('/probe/stray', HttpMethod::Post, new Capability('manage_options'))]
    public function stray(): void
    {
        $wpdb = self::wpdb();
        self::run($wpdb, $wpdb->prepare("ALTER TABLE %i ADD COLUMN `stray` varchar(20) NOT NULL DEFAULT ''", UpgradeProbe::tableName()));
    }

    /**
     * Makes the next request sync the tables.
     */
    #[RestRoute('/resync', HttpMethod::Post, new Capability('manage_options'))]
    public function resync(): void
    {
        $state = get_option(self::SYNC_OPTION);
        if (!is_array($state)) {
            throw new LogicException(sprintf('The option %s of the schema sync is missing.', self::SYNC_OPTION));
        }
        update_option(self::SYNC_OPTION, [...$state, 'hash' => 'outdated'], true);
    }

    /**
     * @return array{deleted: bool}
     */
    #[RestRoute('/probe/{id}', HttpMethod::Delete, new Capability('manage_options'))]
    public function deleteProbe(int $id): array
    {
        $probe = UpgradeProbe::find($id) ?? throw new RestException('dev_test_not_found', 'No such row.', 404);
        $probe->delete();

        return ['deleted' => true];
    }

    private static function find(int $id): LogEntry
    {
        return LogEntry::find($id) ?? throw new RestException('dev_test_not_found', 'No such row.', 404);
    }

    /**
     * @return list<int>
     */
    private static function ids(string $ids): array
    {
        return array_values(array_map(intval(...), array_filter(explode(',', $ids), is_numeric(...))));
    }

    private static function run(wpdb $wpdb, ?string $query): void
    {
        if ($query === null || $wpdb->query($query) === false) {
            throw new RuntimeException($wpdb->last_error);
        }
    }

    private static function wpdb(): wpdb
    {
        $wpdb = $GLOBALS['wpdb'] ?? null;
        if (!$wpdb instanceof wpdb) {
            throw new LogicException('No database.');
        }

        return $wpdb;
    }
}
