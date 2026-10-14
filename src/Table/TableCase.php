<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Table;

/**
 * The queries of TableController.
 */
enum TableCase: string
{
    case Errors = 'errors';
    case ErrorOrRetried = 'error-or-retried';
    case NotReference = 'not-reference';
    case WithoutPost = 'without-post';
    case Recent = 'recent';
    case Page = 'page';
    case Contains = 'contains';
    case HighPriority = 'high-priority';
    case FirstHalf = 'first-half';
    case FlaggedRatio = 'flagged-ratio';
}
