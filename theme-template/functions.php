<?php

// WordPress Titles
add_theme_support( 'title-tag' );

// Register menus
function register_menus() {
  register_nav_menus(
    array(
      'nav-primary' => __('Main menu')
    )
    );
}
add_action( 'init', 'register_menus' );
