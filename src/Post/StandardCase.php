<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

/**
 * The queries of QueryController::standard() on posts and pages of WordPress.
 */
enum StandardCase: string
{
    case Category = 'category';
    case Tag = 'tag';
    case Slug = 'slug';
    case Title = 'title';
    case ModifiedAfter = 'modified-after';
    case ModifiedBefore = 'modified-before';
    case ParentIn = 'parent-in';
    case Template = 'template';
    case DefaultTemplate = 'default-template';
    case Video = 'video';
    case Standard = 'standard';
    case Sticky = 'sticky';
    case NotSticky = 'not-sticky';
    case Password = 'password';
    case MenuOrder = 'menu-order';
    case Commented = 'commented';
    case CommentsClosed = 'comments-closed';
    case SearchTitle = 'search-title';
    case SearchPhrase = 'search-phrase';
}
