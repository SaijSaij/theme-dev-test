<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

/**
 * The queries of QueryController.
 */
enum QueryCase: string
{
    case CapacityOver10 = 'capacity-over-10';
    case CapacityUnder5 = 'capacity-under-5';
    case TalkOrVenue = 'talk-or-venue';
    case WithGenre = 'with-genre';
    case WithoutGenre = 'without-genre';
    case ByCapacity = 'by-capacity';
    case ByStart = 'by-start';
    case Page = 'page';
    case Drafts = 'drafts';
    case Search = 'search';
    case Cached = 'cached';
    case Featured = 'featured';
}
