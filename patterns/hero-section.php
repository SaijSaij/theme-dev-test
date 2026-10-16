<?php

/**
 * Title: Hero section
 * Slug: dev-test/hero-section
 * Categories: featured
 * Description: A section with a hero, text and a check block with a link to a free URL in a group. The build checks it against the blocks of the theme.
 */

?>
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
<!-- wp:dev-test/section {"align":"wide"} -->
<!-- wp:dev-test/hero {"headline":"Pattern <strong>headline</strong>","subline":"Pattern subline","backgroundColor":"#1e4d8c","badges":[{"text":"Free","icon":"check"}],"buttons":[{"label":"Read more","url":"https://example.org/"}]} /-->
<!-- /wp:dev-test/section -->
<!-- wp:dev-test/paragraph -->
<?php echo esc_html__('Paragraph from a pattern', 'theme-dev-test'); ?>
<!-- /wp:dev-test/paragraph -->
<!-- wp:heading {"className":"<?php echo esc_attr('is-pattern-heading'); ?>"} -->
<h2 class="wp-block-heading is-pattern-heading"><?php esc_html_e('Core heading from a pattern', 'theme-dev-test'); ?></h2>
<!-- /wp:heading -->
<!-- wp:dev-test/check {"text":"Pattern check","cta":{"url":"https://example.org/pattern/","opensInNewTab":true,"kind":"url","id":0}} /-->
</div>
<!-- /wp:group -->
