<?php

/**
 * @file
 * Reads profile-configured editorial fields without saving entities.
 *
 * Run via Drush php:script on the explicitly approved environment only.
 */

use Drupal\Core\Session\AnonymousUserSession;

$profile_path = dirname(DRUPAL_ROOT) . '/docs/agent-project.json';
$profile = json_decode(file_get_contents($profile_path), TRUE, 512, JSON_THROW_ON_ERROR);
$settings = $profile['qa']['seo']['editorial'] ?? NULL;
if (!is_array($settings) || empty($settings['entity_types'])) {
  throw new RuntimeException('Configure qa.seo.editorial in the project profile before running this audit.');
}
$manager = \Drupal::entityTypeManager();
$anonymous = new AnonymousUserSession();
$findings = [];
$records = 0;
$plain = static fn (string $value): string => trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5)));
$add = static function (string $level, string $code, string $entity, string $language, string $path, string $evidence, string $suggestion) use (&$findings): void {
  $findings[] = [
    'level' => $level,
    'code' => $code,
    'entity' => $entity,
    'language' => $language,
    'path' => $path,
    'evidence' => $evidence,
    'suggestion' => $suggestion,
  ];
};
foreach ($settings['entity_types'] as $type => $bundles) {
  $definition = $manager->getDefinition($type);
  $storage = $manager->getStorage($type);
  $bundle_key = $definition->getKey('bundle');
  $ids = $storage->getQuery()->accessCheck(FALSE)->condition($bundle_key, $bundles, 'IN')->execute();
  foreach (array_chunk($ids, 100) as $chunk) {
    foreach ($storage->loadMultiple($chunk) as $root) {
      foreach ($root->getTranslationLanguages() as $code => $language) {
        $entity = $root->getTranslation($code);
        if (!$entity->isPublished() || !$entity->access('view', $anonymous)) {
          continue;
        }
        $records++;
        $key = $type . '/' . $entity->id();
        $path = $entity->toUrl()->toString();
        $rule = $settings['bundles'][$entity->bundle()] ?? [];
        $emit = static function (string $level, string $finding, string $evidence, string $suggestion) use ($add, $key, $code, $path): void {
          $add($level, $finding, $key, $code, $path, $evidence, $suggestion);
        };
        foreach ($settings['languages'] ?? [] as $required) {
          if (!$root->hasTranslation($required) || !$root->getTranslation($required)->isPublished() || !$root->getTranslation($required)->access('view', $anonymous)) {
            $emit('warning', 'missing-published-translation', 'No published accessible ' . $required . ' translation.', 'Review translation readiness; do not clone or unpublish automatically.');
          }
        }
        foreach ($rule['required_fields'] ?? [] as $field) {
          if (!$entity->hasField($field)) {
            throw new RuntimeException('Configured audit field does not exist: ' . $entity->bundle() . '.' . $field);
          }
          if ($entity->get($field)->isEmpty()) {
            $emit('warning', 'empty-editorial-field', $field . ' is empty.', 'Supply verified editorial facts or approved media where applicable.');
          }
        }
        if (!empty($rule['body_field'])) {
          $field = $rule['body_field'];
          if (!$entity->hasField($field)) {
            throw new RuntimeException('Configured body field does not exist: ' . $field);
          }
          $text = $plain($entity->get($field)->value ?? '');
          $words = $text === '' ? 0 : count(preg_split('/\s+/u', $text));
          if ($words < ($rule['body_review_words'] ?? 0)) {
            $emit('warning', 'brief-editorial-description', $field . ': ' . $words . ' words.', 'Review whether the description explains the real visitor experience; word count is not a ranking requirement.');
          }
        }
        foreach ($rule['booking_fields'] ?? [] as $field) {
          if (!$entity->hasField($field)) {
            throw new RuntimeException('Configured booking field does not exist: ' . $field);
          }
          foreach ($entity->get($field)->getValue() as $item) {
            $url = $item['uri'] ?? '';
            $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
            if (in_array($host, $settings['placeholder_hosts'] ?? [], TRUE)) {
              $emit('failure', 'placeholder-booking', $field . ': ' . $url, 'Replace with a verified booking URL, or remove after confirming booking is not applicable.');
            }
          }
        }
      }
    }
  }
}
$failures = count(array_filter($findings, static fn (array $item): bool => $item['level'] === 'failure'));
echo json_encode([
  'status' => $failures ? 'failed' : 'passed',
  'counts' => [
    'records' => $records,
    'failures' => $failures,
    'warnings' => count($findings) - $failures,
  ],
  'versions' => [
    'drupal' => \Drupal::VERSION,
    'php' => PHP_VERSION,
  ],
  'findings' => $findings,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
