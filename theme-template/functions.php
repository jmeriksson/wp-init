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

// Add scripts and stylesheets
function load_scripts() {
	wp_enqueue_style( 'custom_style', get_template_directory_uri() . '/public/css/style.css' );
	wp_enqueue_script( 'custom_script', get_template_directory_uri() . '/public/js/script.js', array(), null, true );
}

add_action( 'wp_enqueue_scripts', 'load_scripts' );