<?php
$base = "http://updatescanner.mozdev.org";

function getCookie($cookie, $default)
{
  if (isset($_COOKIE[$cookie]))
    return trim($_COOKIE[$cookie]);
  else
    return $default;
}

function getBrowserLocale()
{
  if (!isset($_SERVER["HTTP_ACCEPT_LANGUAGE"]))
  	return "";
  
  $languages = explode(",", $_SERVER["HTTP_ACCEPT_LANGUAGE"]);
  
  return trim($languages[0]); // First one is the default
}

// First check for parameters
$locale=$_GET['locale'];
$page=$_GET['page'];
$from=$_GET['from'];

// Get locale cookie
if ($locale == "") {
  $locale = getCookie(locale, "");
}

// Try the browser locale
if ($locale =="") {
  $locale = getBrowserLocale();
}

$locale = strtolower($locale);
// First check if the locale directory exists
if ($locale == "" or !file_exists($locale)) {
  // Now try the first 2 characters (eg: "en" in "en-US")
  if (strlen($locale) > 2 and file_exists(substr($locale,0,2))) {
    $locale = substr($locale,0,2);
  } else {
    // No luck - go with English
    $locale = "en";
  }
}

if ($page == "") {
  $page = "index.html";
}

// Pass the from parameter through, for site tracking
if ($from != "") {
  $page = $page."?from=$from";
}

echo "Location: $base/$locale/$page";
//header("Location: $base/$locale/$page");
//exit;
?>
