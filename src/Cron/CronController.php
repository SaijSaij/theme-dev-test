<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cron;

use Closure;
use DateTimeImmutable;
use LogicException;
use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Cron\CronScheduler;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\Capability;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

/**
 * State and controls of cron.spec.js: the scheduled events of the theme, events made due or moved off their phase,
 * and tasks of the CronScheduler.
 */
#[RestController(Api::VERSION, base: '/cron')]
final readonly class CronController
{
    /** The hooks of the events: wp_app_framework/cron/{slug}/{name}. */
    private const string HOOK = 'wp_app_framework/cron/theme-dev-test/';

    private const array EVENTS = ['heartbeat', 'nightly', 'weekly'];

    public function __construct(
        private CronScheduler $cron,
        private CronCounter $counter,
    ) {}

    /**
     * @return array{now: int, events: array<string, array{schedule: string|false, interval: int|null, timestamp: int, local: string}|null>, interval: array{interval: int, display: string}|null, counts: array<mixed>}
     */
    #[RestRoute('/state', HttpMethod::Get, new Capability('manage_options'))]
    public function state(): array
    {
        $events = [];
        foreach (self::EVENTS as $name) {
            $event = wp_get_scheduled_event(self::HOOK . $name);
            $events[$name] = $event === false ? null : [
                'schedule' => $event->schedule,
                'interval' => $event->interval ?? null,
                'timestamp' => $event->timestamp,
                'local' => (string) wp_date('N H:i', $event->timestamp),
            ];
        }

        return [
            'now' => time(),
            'events' => $events,
            'interval' => wp_get_schedules()[self::HOOK . 'every-3600'] ?? null,
            'counts' => $this->counter->getCounts(),
        ];
    }

    /**
     * Makes the heartbeat due: its next run moves to the past, in the same schedule.
     */
    #[RestRoute('/due', HttpMethod::Post, new Capability('manage_options'))]
    public function due(): void
    {
        $this->reschedule(self::HOOK . 'heartbeat', static fn(): int => time() - 1);
    }

    /**
     * Moves the nightly event an hour off its phase, as WP-Cron does after a change of daylight saving time.
     */
    #[RestRoute('/shift', HttpMethod::Post, new Capability('manage_options'))]
    public function shift(): void
    {
        $this->reschedule(self::HOOK . 'nightly', static fn(int $timestamp): int => $timestamp + 3600);
    }

    #[RestRoute('/task', HttpMethod::Post, new Capability('manage_options'))]
    public function schedule(int $id, TestTaskKind $kind = TestTaskKind::First, int $delay = 0): bool
    {
        return $this->cron->schedule(new TestTask($id, $kind), new DateTimeImmutable('@' . (time() + $delay)));
    }

    #[RestRoute('/task', HttpMethod::Get, new Capability('manage_options'))]
    public function isScheduled(int $id, TestTaskKind $kind = TestTaskKind::First): bool
    {
        return $this->cron->isScheduled(new TestTask($id, $kind));
    }

    #[RestRoute('/task', HttpMethod::Delete, new Capability('manage_options'))]
    public function unschedule(int $id, TestTaskKind $kind = TestTaskKind::First): int
    {
        return $this->cron->unschedule(new TestTask($id, $kind));
    }

    #[RestRoute('/counts', HttpMethod::Delete, new Capability('manage_options'))]
    public function resetCounts(): void
    {
        $this->counter->reset();
    }

    /**
     * Schedules an event again in its schedule, at a new time.
     *
     * @param Closure(int): int $timestamp The new time from the scheduled one.
     */
    private function reschedule(string $hook, Closure $timestamp): void
    {
        $event = wp_get_scheduled_event($hook);
        if ($event === false || $event->schedule === false) {
            throw new LogicException(sprintf('The event %s is not scheduled.', $hook));
        }
        wp_clear_scheduled_hook($hook);
        wp_schedule_event($timestamp($event->timestamp), $event->schedule, $hook);
    }
}
