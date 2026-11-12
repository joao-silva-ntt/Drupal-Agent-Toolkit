---
name: drupal-caching
description: "Use when implementing or debugging Drupal cache tags, cache contexts, max-age, render caching, Dynamic Page Cache, cache bins, lazy builders, invalidation, or cache-related performance issues."
---

# Drupal Caching Strategies

Before substantial project work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for caching infrastructure, commands, and test
targets. Inspect the running stack rather than assuming a cache backend.

## When to Use This Skill

Use this skill when working on:
- Performance optimization
- Custom cache tag implementations
- Cache invalidation strategies
- Render array caching
- Custom cache bins
- Dynamic Page Cache configuration
- CDN/Varnish integration
- Cache contexts for personalization
- Debugging cache-related issues

## Drupal Cache System Overview

### Cache Layers in Drupal

**1. Page Cache** (for anonymous users)
- Full page responses cached
- Disabled when user is logged in
- Configuration: `system.performance` settings

**2. Dynamic Page Cache** (for logged-in users)
- Caches pages minus personalized parts
- Uses cache contexts to vary by user, role, etc.
- Enabled by default in supported Drupal 10/11 installations; verify the project's enabled modules and cache configuration before changing settings.

**3. Render Cache**
- Caches render arrays
- Uses cache tags, contexts, and max-age
- Granular caching at component level

**4. Entity Cache**
- Entities cached in memory during request
- Static cache cleared on entity save

**5. Discovery Cache**
- Plugin definitions, hooks, routing
- Rebuilt on cache clear

## Cache Metadata

### Cache Tags

**Purpose:** Invalidate cache when specific data changes

**Pattern:**
```php
// Entity cache tags
'node:123'           // Specific node
'node_list'          // All node listings
'user:45'            // Specific user
'taxonomy_term:67'   // Specific term
'config:system.site' // Configuration object

// Custom cache tags
'my_module:data_type'
'product_catalog'
'navigation_menu:main'
```

**Implementation:**
```php
// Add cache tags to render array
$build = [
  '#markup' => $content,
  '#cache' => [
    'tags' => [
      'node:' . $node->id(),
      'custom_data:my_type',
    ],
  ],
];

// Service implementation
$data = [
  '#markup' => $this->getData(),
  '#cache' => [
    'tags' => ['my_module:data_source'],
  ],
];

// Multiple entity tags
$tags = [];
foreach ($nodes as $node) {
  $tags[] = 'node:' . $node->id();
}
$build['#cache']['tags'] = $tags;
```

**Invalidating Cache Tags:**
```php
use Drupal\Core\Cache\Cache;

// Invalidate specific tags
\Drupal::service('cache_tags.invalidator')->invalidateTags([
  'node:123',
  'my_module:custom_tag',
]);

// Or using Cache utility
Cache::invalidateTags(['node_list', 'custom_tag']);

// In entity save (automatic)
public function postSave(EntityStorageInterface $storage, $update = TRUE) {
  parent::postSave($storage, $update);

  // Invalidate custom tags
  Cache::invalidateTags(['my_custom_listing']);
}
```

### Cache Contexts

**Purpose:** Vary cache by specific conditions (user, role, language, etc.)

**Built-in Contexts:**
- `user` - Per-user caching
- `user.roles` - Per-role caching
- `languages:language_interface` - Per-language
- `url` - Per-URL
- `url.path` - Per-path
- `url.query_args` - By query parameters
- `url.query_args:sort` - By specific query arg
- `theme` - Per-theme
- `timezone` - Per-timezone
- `session` - Per-session

**Implementation:**
```php
// Vary by user role
$build = [
  '#markup' => $role_specific_content,
  '#cache' => [
    'contexts' => ['user.roles'],
  ],
];

// Vary by URL and user
$build['#cache']['contexts'] = ['url.path', 'user'];

// Vary by custom query parameter
$build['#cache']['contexts'] = ['url.query_args:filter'];

// Vary by multiple contexts
$build['#cache']['contexts'] = [
  'languages:language_interface',
  'theme',
  'user.roles',
];
```

**Custom Cache Context:**
```php
// src/Cache/Context/CustomCacheContext.php
namespace Drupal\my_module\Cache\Context;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\Context\CacheContextInterface;

class CustomCacheContext implements CacheContextInterface {

  public static function getLabel() {
    return t('Custom Context');
  }

  public function getContext() {
    // Return string that varies by your condition
    $custom_value = $this->getCustomValue();
    return $custom_value;
  }

  public function getCacheableMetadata() {
    return new CacheableMetadata();
  }

  protected function getCustomValue() {
    // Your logic here
    return 'custom_value_' . time();
  }
}

// Register in my_module.services.yml
services:
  cache_context.custom:
    class: Drupal\my_module\Cache\Context\CustomCacheContext
    tags:
      - { name: cache.context }
```

### Cache Max-Age

**Purpose:** How long to cache (in seconds)

**Values:**
- `0` - Do not cache (use for personalized/dynamic content)
- `300` - Cache for 5 minutes
- `3600` - Cache for 1 hour
- `86400` - Cache for 24 hours
- `Cache::PERMANENT` - Cache until invalidated (default)

**Implementation:**
```php
use Drupal\Core\Cache\Cache;

// Cache for 1 hour
$build = [
  '#markup' => $time_sensitive_content,
  '#cache' => [
    'max-age' => 3600,
  ],
];

// Do not cache (personalized content)
$build['#cache']['max-age'] = 0;

// Cache permanently until tags invalidated
$build['#cache']['max-age'] = Cache::PERMANENT;

// Merge max-age (most restrictive wins)
$cacheability = CacheableMetadata::createFromRenderArray($build);
$cacheability->merge($other_cacheability);
$cacheability->applyTo($build);
```

## Render Caching Patterns

### Basic Render Array Caching

```php
// Controller or Block
public function build() {
  $config = $this->config('my_module.settings');

  $build = [
    '#theme' => 'my_template',
    '#data' => $this->getData(),
    '#cache' => [
      'tags' => [
        'config:my_module.settings',
        'custom_data:source',
      ],
      'contexts' => ['user.roles'],
      'max-age' => 3600, // 1 hour
    ],
  ];

  return $build;
}
```

### Lazy Builder Pattern (Personalized Content)

**Use when:** Content is personalized but rest of page can be cached

```php
// Service: my_module.lazy_builder
namespace Drupal\my_module\Service;

class MyLazyBuilder {

  public function buildPersonalizedContent() {
    $user = \Drupal::currentUser();

    return [
      '#markup' => $this->t('Hello @name', ['@name' => $user->getDisplayName()]),
      '#cache' => [
        'contexts' => ['user'],
        'max-age' => 0, // Personalized
      ],
    ];
  }
}

// In render array
$build['personalized'] = [
  '#lazy_builder' => [
    'my_module.lazy_builder:buildPersonalizedContent',
    [],
  ],
  '#create_placeholder' => TRUE,
];

// Services file
services:
  my_module.lazy_builder:
    class: Drupal\my_module\Service\MyLazyBuilder
```

### Auto-Placeholdering

**Automatic placeholdering** for content with max-age 0:

```php
// This automatically becomes a placeholder
$build = [
  '#markup' => $personalized_content,
  '#cache' => [
    'contexts' => ['user'],
    'max-age' => 0,
  ],
];
```

### Bubble Cache Metadata

```php
use Drupal\Core\Cache\CacheableMetadata;

// Create cacheable metadata
$cacheability = new CacheableMetadata();
$cacheability->setCacheContexts(['user.roles']);
$cacheability->setCacheTags(['node:123']);
$cacheability->setCacheMaxAge(3600);

// Apply to render array
$cacheability->applyTo($build);

// Merge from object
$entity_cacheability = CacheableMetadata::createFromObject($entity);
$entity_cacheability->applyTo($build);

// Merge from render array
$existing = CacheableMetadata::createFromRenderArray($build);
$cacheability->merge($existing);
$cacheability->applyTo($build);
```

## Cache Bins

### Using Cache Bins

**Default bins:**
- `default` - General cache
- `render` - Render cache
- `data` - Persistent data
- `bootstrap` - Early bootstrap
- `config` - Configuration cache
- `discovery` - Plugin discovery

**Access cache bins:**
```php
// Get cache bin
$cache = \Drupal::cache('my_custom_bin');

// Or via dependency injection
public function __construct(CacheBackendInterface $cache) {
  $this->cache = $cache;
}

public static function create(ContainerInterface $container) {
  return new static(
    $container->get('cache.my_custom_bin')
  );
}
```

**Cache operations:**
```php
// Set cache
$cache->set('cache_key', $data, Cache::PERMANENT, ['tag1', 'tag2']);

// Set with expiration
$expire_time = time() + 3600; // 1 hour
$cache->set('cache_key', $data, $expire_time, ['tag1']);

// Get cache
$cached = $cache->get('cache_key');
if ($cached) {
  $data = $cached->data;
}

// Get multiple
$cids = ['key1', 'key2', 'key3'];
$cached_items = $cache->getMultiple($cids);

// Delete cache
$cache->delete('cache_key');

// Delete multiple
$cache->deleteMultiple(['key1', 'key2']);

// Delete by tags
$cache->invalidateTags(['tag1', 'tag2']);

// Delete all
$cache->deleteAll();
```

### Custom Cache Bin

```php
// Define in my_module.services.yml
services:
  cache.my_custom_bin:
    class: Drupal\Core\Cache\CacheBackendInterface
    tags:
      - { name: cache.bin }
    factory: cache_factory:get
    arguments: [my_custom_bin]
```

## Common Caching Patterns

### Pattern 1: Cache Expensive Queries

```php
use Drupal\Core\Cache\Cache;

public function getExpensiveData($params) {
  $cid = 'my_module:expensive_data:' . md5(serialize($params));
  $cache = \Drupal::cache();

  // Try to get from cache
  if ($cached = $cache->get($cid)) {
    return $cached->data;
  }

  // Calculate expensive data
  $data = $this->performExpensiveQuery($params);

  // Cache for 1 hour
  $cache->set($cid, $data, time() + 3600, [
    'my_module:expensive_data',
  ]);

  return $data;
}
```

### Pattern 2: Entity-Based Caching

```php
public function getNodeSummary($nid) {
  $node = \Drupal::entityTypeManager()
    ->getStorage('node')
    ->load($nid);

  $build = [
    '#theme' => 'node_summary',
    '#node' => $node,
    '#cache' => [
      'tags' => $node->getCacheTags(),
      'contexts' => ['languages:language_interface'],
      'max-age' => Cache::PERMANENT,
    ],
  ];

  return $build;
}
```

### Pattern 3: List Caching

```php
public function getNodeList() {
  $query = $this->entityTypeManager
    ->getStorage('node')
    ->getQuery()
    ->condition('status', 1)
    ->sort('created', 'DESC')
    ->range(0, 10);

  $nids = $query->execute();

  $build = [
    '#theme' => 'node_list',
    '#nodes' => $this->loadMultiple($nids),
    '#cache' => [
      'tags' => ['node_list'], // Invalidate when any node changes
      'contexts' => ['languages:language_interface'],
      'max-age' => 3600,
    ],
  ];

  return $build;
}
```

### Pattern 4: Configuration-Based Caching

```php
public function buildFromConfig() {
  $config = $this->config('my_module.settings');

  $build = [
    '#markup' => $config->get('message'),
    '#cache' => [
      'tags' => $config->getCacheTags(),
    ],
  ];

  return $build;
}
```

### Pattern 5: Time-Based Caching

```php
public function getTimeSensitiveData() {
  // Cache until end of hour
  $expire = strtotime('+1 hour', strtotime(date('Y-m-d H:00:00')));

  $cid = 'my_module:hourly_data';
  $cache = \Drupal::cache();

  if ($cached = $cache->get($cid)) {
    return $cached->data;
  }

  $data = $this->fetchHourlyData();
  $cache->set($cid, $data, $expire);

  return $data;
}
```

## Dynamic Page Cache

### Configuration

```php
// Enabled by default in Drupal 10
// Disable for specific routes in routing.yml
my_module.no_cache_route:
  path: '/my-path'
  defaults:
    _controller: '\Drupal\my_module\Controller\MyController::content'
  options:
    no_cache: TRUE
```

### Response Caching Control

```php
use Symfony\Component\HttpFoundation\Response;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\CacheableResponse;

// Disable caching for response
public function myController() {
  $response = new Response($content);
  $response->setPrivate(); // Do not cache
  return $response;
}

// Cacheable response
public function cacheableController() {
  $build = ['#markup' => $content];

  $response = new CacheableResponse($content);
  $cache_metadata = new CacheableMetadata();
  $cache_metadata->setCacheContexts(['user.roles']);
  $cache_metadata->setCacheTags(['custom:tag']);
  $cache_metadata->setCacheMaxAge(3600);
  $cache_metadata->addCacheableDependency($response);

  return $response;
}
```

## BigPipe

**Purpose:** Stream page placeholders progressively

**Enable:**
```yaml
# core.extension.yml
module:
  big_pipe: 0
```

**Usage:**
```php
// Automatically enabled for lazy builders
$build['slow_content'] = [
  '#lazy_builder' => ['my_module.lazy_builder:buildSlowContent', []],
  '#create_placeholder' => TRUE,
];
```

## CDN/Varnish Integration

### Cache Tags Header

**Drupal sends cache tags in headers for CDN/Varnish purging:**

```
X-Drupal-Cache-Tags: node:123 node_list config:system.site
```

### Purge Module Integration

```bash
composer require drupal/purge drupal/varnish_purge
drush en purge purge_queuer_coretags purge_processor_lateruntime varnish_purge
```

**Configuration:**
- Configure purgers in admin UI
- Set up queue processing
- Configure Varnish/CDN endpoints

## Performance Optimization Tips

### 1. Use Specific Cache Tags

```php
// ❌ Too broad
$build['#cache']['tags'] = ['node_list'];

// ✅ More specific
$build['#cache']['tags'] = [
  'node_list:article',
  'taxonomy_term:5',
];
```

### 2. Appropriate Cache Contexts

```php
// ❌ Too restrictive
$build['#cache']['contexts'] = ['user'];

// ✅ Use role if role-based
$build['#cache']['contexts'] = ['user.roles'];
```

### 3. Avoid max-age 0 When Possible

```php
// ❌ Uncacheable
$build['#cache']['max-age'] = 0;

// ✅ Use lazy builder for personalized parts only
$build['static_part'] = [
  '#markup' => $static_content,
  '#cache' => ['max-age' => Cache::PERMANENT],
];
$build['personalized'] = [
  '#lazy_builder' => ['my_module:buildPersonalized', []],
];
```

### 4. Cache Query Results

```php
// ❌ Query every time
$results = $this->database->query($expensive_query)->fetchAll();

// ✅ Cache results
$cid = 'my_module:query:' . md5($query);
if ($cache = \Drupal::cache()->get($cid)) {
  $results = $cache->data;
} else {
  $results = $this->database->query($expensive_query)->fetchAll();
  \Drupal::cache()->set($cid, $results, time() + 3600, ['my_module:queries']);
}
```

## Debugging Cache Issues

### Enable Verbose Caching

```php
// In settings.php
$config['system.performance']['cache']['page']['use_internal_page_cache_when_debugging'] = TRUE;
```

### Check Cache Metadata

```php
use Drupal\Core\Render\RenderContext;

$context = new RenderContext();
$output = \Drupal::service('renderer')->executeInRenderContext($context, function() use ($build) {
  return \Drupal::service('renderer')->render($build);
});

// Get cache metadata
$cache_metadata = $context->getCacheableMetadata();
kint($cache_metadata->getCacheTags());
kint($cache_metadata->getCacheContexts());
kint($cache_metadata->getCacheMaxAge());
```

### Devel Debug

```php
// Add to render array to see cache info
$build['#attached']['library'][] = 'devel/devel-toolbar';
```

### Disable Caching (Development)

```php
// In settings.local.php
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';

// In development.services.yml
parameters:
  http.response.debug_cacheability_headers: true
services:
  cache.backend.null:
    class: Drupal\Core\Cache\NullBackendFactory
```

## Common Cache Problems & Solutions

### Problem: Changes Not Appearing

**Solution:**
```bash
drush cr  # Clear all caches
```

### Problem: Personalized Content Cached

**Solution:**
- Check cache contexts: should include `user` or `user.roles`
- Use lazy builders for personalized parts
- Set `max-age` to 0 for personalized content

### Problem: Too Many Cache Invalidations

**Solution:**
- Make cache tags more specific
- Check for unnecessary `node_list` invalidations
- Use separate cache bins for different data types

### Problem: Memory Issues

**Solution:**
```php
// Use cache bins instead of loading everything
$cache = \Drupal::cache('my_custom_bin');

// Paginate queries
$query->range($offset, $limit);

// Clear static cache periodically
\Drupal::entityTypeManager()->getStorage('node')->resetCache();
```

## Quick Reference

### Essential Cache Commands

```bash
# Clear all caches
drush cr

# Clear specific cache bin
drush cache:clear render

# Rebuild cache
drush cache:rebuild

# Get cache statistics
drush eval "print_r(\Drupal::cache()->get('cache_key'));"
```

### Cache Array Structure

```php
$build['#cache'] = [
  'tags' => ['tag1', 'tag2'],        // What to invalidate
  'contexts' => ['user.roles'],      // Vary by what
  'max-age' => 3600,                 // How long to cache
  'keys' => ['custom', 'cache_key'], // Cache ID parts (optional)
];
```

### Cache Invalidation Priority

1. **max-age 0** - Never cached
2. **max-age N** - Cached for N seconds
3. **Cache tags** - Invalidated when tagged content changes
4. **Cache contexts** - Separate cache per context variation

## Best Practices Summary

✅ **DO:**
- Use specific cache tags
- Choose appropriate cache contexts
- Set reasonable max-age values
- Use lazy builders for personalized content
- Cache expensive operations
- Document custom cache tags

❌ **DON'T:**
- Use `max-age 0` for entire pages
- Over-invalidate with broad tags like `node_list`
- Use `user` context when `user.roles` suffices
- Cache sensitive/private data without proper contexts
- Forget to add cache metadata to render arrays
- Mix cached and uncached content without lazy builders
