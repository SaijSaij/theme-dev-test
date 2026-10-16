<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Rule;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * A block whose root element is a void element (<hr>): the editor renders it without children.
 */
#[Block('rule', title: 'Rule', category: BlockCategory::Design, icon: 'minus')]
final readonly class Rule
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(RuleAttributes $attrs): string
    {
        return $this->renderer->render('Block/Rule/Rule.twig', ['attrs' => $attrs]);
    }
}
