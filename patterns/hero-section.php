<?php

/**
 * Title: Hero section
 * Slug: dev-test/hero-section
 * Categories: featured
 * Description: A section with a hero and text in a group. The build checks it against the blocks of the theme.
 */

?>
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
<!-- wp:dev-test/section {"align":"wide"} -->
<!-- wp:dev-test/hero {"topline":"Pattern topline","headline":"Pattern <strong>headline</strong>","gradient":"blue","buttons":[{"label":"Read more","url":"https://example.org/"}]} /-->
<!-- /wp:dev-test/section -->
<!-- wp:dev-test/paragraph -->
<?php echo esc_html__('Paragraph from a pattern', 'theme-dev-test'); ?>
<!-- /wp:dev-test/paragraph -->
<!-- wp:heading {"className":"<?php echo esc_attr('is-pattern-heading'); ?>"} -->
<h2 class="wp-block-heading is-pattern-heading"><?php esc_html_e('Core heading from a pattern', 'theme-dev-test'); ?></h2>
<!-- /wp:heading -->
</div>
<!-- /wp:group -->
