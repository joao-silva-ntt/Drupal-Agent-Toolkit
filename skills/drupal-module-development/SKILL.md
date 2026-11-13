---
name: drupal-module-development
description: "Create and maintain custom Drupal modules. Use for module metadata, controllers, forms, services, plugins, event subscribers, hooks, update hooks, dependency injection, Entity API, and tests."
argument-hint: "Describe the module to create or the feature to add: module machine name, purpose, required components (controller/form/service/plugin/hook), dependencies, and any specific requirements"
---

# Drupal Module Development

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for Drupal/PHP versions, module paths, dependency
policy, tests, and approved commands. If missing, inspect safely and ask about
material blockers.

## When to Use

Invoke this skill whenever you need to:
- Create a new custom module from scratch
- Add controllers, forms, or routes to an existing module
- Define services with dependency injection
- Create plugin derivatives (blocks, fields, formatters, widgets)
- Implement event subscribers for kernel or entity events
- Write hooks in .module files (entity hooks, form alters, theme hooks)
- Create update hooks in .install files for schema or config changes
- Set up permissions, menu links, or local tasks
- Work with Entity API (load, save, query, access checks)
- Integrate automated tests (Unit, Kernel, Functional)

## Do Not Use When

- The task is only about theming or Twig templates (use drupal-theme-development instead).
- The task is only about configuration management or deployment (use drupal-configuration-management instead).
- The task is only about testing patterns without module context (use drupal-testing instead).
- The request concerns contrib module configuration rather than custom code.

---

## Rules (non-negotiable)

### 0. Check for a contrib module first

Before creating or extending a custom module, confirm the need cannot be met
by core configuration or a maintained contrib module compatible with the
project's installed Drupal version. Verify current maintenance/security status.
Write custom code only when no suitable option fits, and state why.

### 1. Prefer dependency injection

Use constructor injection in services, controllers, forms, and plugins where the
framework supports it. Procedural hooks and update hooks do not support normal
constructor injection; use the narrowest appropriate Drupal API there and keep
the procedural code minimal.

Good:
```php
public function __construct(
  protected EntityTypeManagerInterface $entityTypeManager,
) {}

public static function create(ContainerInterface $container) {
  return new static(
    $container->get('entity_type.manager')
  );
}
```

Bad:
```php
$entityTypeManager = \Drupal::service('entity_type.manager');
```

### 2. All classes follow PSR-4 autoloading

Classes must be in `src/` with proper namespace: `Drupal\{module_name}\{Type}`.

- Controllers: `src/Controller/`
- Forms: `src/Form/`
- Plugins: `src/Plugin/{PluginType}/`
- Services: `src/Service/` or `src/`
- Event Subscribers: `src/EventSubscriber/`
- Tests: `tests/src/{Unit,Kernel,Functional}/`

### 3. Use Entity API over raw database queries

Always prefer entity type manager and entity query over raw SQL.

Good:
```php
$nodes = $this->entityTypeManager
  ->getStorage('node')
  ->getQuery()
  ->accessCheck(TRUE)
  ->condition('type', 'article')
  ->execute();
```

Bad:
```php
$result = \Drupal::database()->query("SELECT nid FROM {node} WHERE type = 'article'");
```

### 4. Preserve correct cache metadata

Add or bubble the cache tags, contexts, and max-age required by the data and
access conditions the render array depends on. Do not add redundant metadata
when Drupal's child render arrays already provide it, and do not use arbitrary
finite max-age values as a substitute for correct invalidation.

```php
$access = $node->access('view', $this->currentUser(), TRUE);
$build = $access->isAllowed()
  ? $this->entityTypeManager()->getViewBuilder('node')->view($node)
  : [];
\Drupal\Core\Cache\CacheableMetadata::createFromRenderArray($build)
  ->addCacheableDependency($node)
  ->addCacheableDependency($access)
  ->applyTo($build);
return $build;
```

This controller example preserves entity and access-result cache metadata,
including on denied output. It does not invent a cache lifetime.

### 5. Check entity access before operations

Check the requested operation's access before displaying or modifying an
entity. Loading an entity is not itself an access check.

```php
if ($node->access('view', $this->currentUser)) {
  // Safe to display
}
```

### 6. Use update hooks for deployed data/schema transitions

Use an update hook when deployed code must transform existing data or perform
a database/schema transition through Drupal's update system. Normal exported
configuration changes are deployed through config import and do not each
require an update hook. Check Drupal's supported entity definition update path
before deciding that a field/storage change needs custom update code.

```php
function my_module_update_10001() {
  $config = \Drupal::configFactory()->getEditable('my_module.settings');
  $config->set('new_key', 'default_value')->save();
  return t('Added new configuration key.');
}
```

---

## Module Structure

```
web/modules/custom/my_module/
├── my_module.info.yml          # Module metadata
├── my_module.module             # Hooks and procedural code
├── my_module.services.yml       # Service definitions
├── my_module.routing.yml        # Route definitions
├── my_module.permissions.yml    # Permission definitions
├── my_module.links.menu.yml     # Menu links
├── my_module.links.task.yml     # Local task links (tabs)
├── my_module.links.action.yml   # Action links
├── my_module.install            # Install/update hooks
├── composer.json                # Optional: Composer metadata
├── README.md                    # Documentation
├── src/                         # PSR-4 autoloaded classes
│   ├── Controller/              # Controllers
│   ├── Form/                    # Forms
│   ├── Plugin/                  # Plugins
│   │   ├── Block/              # Block plugins
│   │   └── Field/              # Field plugins
│   ├── Service/                 # Custom services
│   ├── EventSubscriber/         # Event subscribers
│   └── Entity/                  # Custom entities
├── config/
│   ├── install/                 # Default configuration
│   ├── optional/                # Optional configuration
│   └── schema/                  # Configuration schema
├── templates/                   # Twig templates
└── tests/                       # Tests
    └── src/
        ├── Unit/                # Unit tests
        ├── Kernel/              # Kernel tests
        └── Functional/          # Functional tests
```

## Module Info File

`my_module.info.yml`:
```yaml
name: 'My Module'
description: 'Description of what the module does'
type: module
core_version_requirement: ^10 || ^11

# Dependencies (format: module_provider:module_name)
dependencies:
  - drupal:node
  - drupal:user
  - pathauto:pathauto

# Link to configuration form
configure: my_module.settings

# PHP version requirement
php: '8.3'

# Module package for grouping in admin
package: 'Custom'
```

## Common Files

### Routing (my_module.routing.yml)

```yaml
my_module.example_page:
  path: '/example/page'
  defaults:
    _controller: '\Drupal\my_module\Controller\ExampleController::content'
    _title: 'Example Page'
  requirements:
    _permission: 'access content'

my_module.admin_form:
  path: '/admin/config/my-module/settings'
  defaults:
    _form: '\Drupal\my_module\Form\SettingsForm'
    _title: 'My Module Settings'
  requirements:
    _permission: 'administer my_module'
  options:
    _admin_route: TRUE
```

### Permissions (my_module.permissions.yml)

```yaml
administer my_module:
  title: 'Administer My Module'
  description: 'Configure My Module settings'
  restrict access: TRUE

use my_module features:
  title: 'Use My Module features'
  description: 'Access and use My Module functionality'
```

### Services (my_module.services.yml)

```yaml
services:
  my_module.example_service:
    class: Drupal\my_module\Service\ExampleService
    arguments:
      - '@entity_type.manager'
      - '@current_user'

  my_module.event_subscriber:
    class: Drupal\my_module\EventSubscriber\MyModuleSubscriber
    arguments:
      - '@current_user'
    tags:
      - { name: event_subscriber }
```

## Code Patterns

### Controller with Dependency Injection

```php
<?php

namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

class ExampleController extends ControllerBase {

  public function __construct(EntityTypeManagerInterface $entityTypeManager) {
    $this->entityTypeManager = $entityTypeManager;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager')
    );
  }

  public function content() {
    return [
      '#markup' => $this->t('Hello from My Module!'),
    ];
  }
}
```

### Configuration Form

```php
<?php

namespace Drupal\my_module\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class SettingsForm extends ConfigFormBase {

  protected function getEditableConfigNames() {
    return ['my_module.settings'];
  }

  public function getFormId() {
    return 'my_module_settings_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('my_module.settings');

    $form['display_label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Display label'),
      '#default_value' => $config->get('display_label'),
      '#required' => TRUE,
    ];

    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('my_module.settings')
      ->set('display_label', $form_state->getValue('display_label'))
      ->save();

    parent::submitForm($form, $form_state);
  }
}
```

### Service

```php
<?php

namespace Drupal\my_module\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;

class ExampleService {

  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected AccountProxyInterface $currentUser,
  ) {}

  public function doSomething(int $node_id): array {
    $node = $this->entityTypeManager->getStorage('node')->load($node_id);
    if (!$node || !$node->access('view', $this->currentUser)) {
      return ['success' => FALSE, 'error' => 'Access denied or not found'];
    }

    return [
      'success' => TRUE,
      'data' => $node->getTitle(),
    ];
  }
}
```

Unexpected storage failures propagate to the caller's established exception
handling instead of becoming success-shaped or generic fallback data. This
service result is not a render array; render consumers must separately bubble
entity and access metadata as shown above.

### Block Plugin

```php
<?php

namespace Drupal\my_module\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Provides a custom block.
 *
 * @Block(
 *   id = "my_custom_block",
 *   admin_label = @Translation("My Custom Block"),
 *   category = @Translation("Custom"),
 * )
 */
class CustomBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected EntityTypeManagerInterface $entityTypeManager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager')
    );
  }

  public function build() {
    return [
      '#markup' => $this->t('Block content'),
    ];
  }
}
```

### Event Subscriber

```php
<?php

namespace Drupal\my_module\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Drupal\Core\Session\AccountProxyInterface;

class MyModuleSubscriber implements EventSubscriberInterface {

  public function __construct(
    protected AccountProxyInterface $currentUser,
  ) {}

  public static function getSubscribedEvents() {
    return [
      KernelEvents::REQUEST => ['onRequest', 20],
    ];
  }

  public function onRequest(RequestEvent $event) {
    if ($this->currentUser->isAuthenticated()) {
      // React to authenticated user requests
    }
  }
}
```

## Common Hooks

```php
<?php

/**
 * Implements hook_entity_presave().
 */
function my_module_entity_presave(Drupal\Core\Entity\EntityInterface $entity) {
  if ($entity->getEntityTypeId() === 'node' && $entity->bundle() === 'article') {
    $entity->set('field_name', 'value');
  }
}

/**
 * Implements hook_form_alter().
 */
function my_module_form_alter(&$form, \Drupal\Core\Form\FormStateInterface $form_state, $form_id) {
  if ($form_id === 'node_article_form') {
    $form['title']['widget'][0]['value']['#description'] = t('Custom description');
  }
}

/**
 * Implements hook_theme().
 */
function my_module_theme($existing, $type, $theme, $path) {
  return [
    'my_module_custom_template' => [
      'variables' => [
        'title' => NULL,
        'items' => [],
      ],
      'template' => 'my-module-custom-template',
    ],
  ];
}
```

## Update Hooks (my_module.install)

```php
<?php

/**
 * Implements hook_install().
 */
function my_module_install() {
  \Drupal::configFactory()->getEditable('my_module.settings')
    ->set('enable_feature', TRUE)
    ->save();
}

/**
 * Implements hook_uninstall().
 */
function my_module_uninstall() {
  \Drupal::configFactory()->getEditable('my_module.settings')->delete();
}

/**
 * Implements hook_schema().
 */
function my_module_schema() {
  $schema['my_module_table'] = [
    'description' => 'Stores custom data',
    'fields' => [
      'id' => [
        'type' => 'serial',
        'not null' => TRUE,
      ],
      'nid' => [
        'type' => 'int',
        'not null' => TRUE,
      ],
    ],
    'primary key' => ['id'],
    'indexes' => [
      'nid' => ['nid'],
    ],
  ];
  return $schema;
}

/**
 * Add new configuration key.
 */
function my_module_update_10001() {
  \Drupal::configFactory()->getEditable('my_module.settings')
    ->set('new_setting', 'default_value')
    ->save();
  return t('Added new setting.');
}

/**
 * Add new database field.
 */
function my_module_update_10002() {
  $schema = \Drupal::database()->schema();
  if (!$schema->fieldExists('my_module_table', 'new_field')) {
    $schema->addField('my_module_table', 'new_field', [
      'type' => 'varchar',
      'length' => 255,
      'not null' => FALSE,
    ]);
  }
  return t('Added new field to table.');
}
```

## Quick Reference

```bash
# Enable module
drush en my_module -y

# Uninstall module
drush pmu my_module -y

# Run update hooks
drush updb -y

# Clear cache
drush cr

# Generate module code
drush generate module

# Check coding standards
phpcs --standard=Drupal,DrupalPractice web/modules/custom/my_module

# Fix coding standards
phpcbf --standard=Drupal web/modules/custom/my_module
```
