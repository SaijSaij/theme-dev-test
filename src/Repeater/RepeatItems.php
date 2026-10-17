<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Repeater;

use WebCodingCat\ThemeDevTest\Post\Event;
use WebCodingCat\ThemeDevTest\Table\LogEntry;
use WebCodingCat\WpAppFramework\Block\Repeater;
use WebCodingCat\WpAppFramework\Block\RepeaterItem;

/**
 * The items of a repeat list: the inner blocks rendered for each ID, by the kind of item.
 */
final class RepeatItems
{
    /**
     * @return list<RepeaterItem>
     */
    public function items(RepeatListAttributes $attrs, Repeater $repeater): array
    {
        $items = [];
        foreach (array_filter(array_map('trim', explode(',', $attrs->ids))) as $entry) {
            [$source, $id] = $attrs->source === RepeatSource::Mixed
                ? [RepeatSource::from(strtok($entry, ':') ?: ''), (int) substr($entry, (int) strpos($entry, ':') + 1)]
                : [$attrs->source, (int) $entry];
            $items[] = match ($source) {
                RepeatSource::Events => $repeater->post(Event::get($id)),
                RepeatSource::Genres => $repeater->term($id),
                RepeatSource::Comments => $repeater->comment($id),
                RepeatSource::Users => $repeater->user($id),
                RepeatSource::Log => $repeater->row(LogEntry::get($id)),
                RepeatSource::Mixed => throw new \InvalidArgumentException('A mixed list names the kind of each item.'),
            };
        }

        return $items;
    }
}
