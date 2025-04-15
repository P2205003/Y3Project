<template>
  <footer>
    <div class="footer-content">
      <div class="footer-column">
        <h3>{{ t('appName') }}</h3>
        <p>{{ t('footer.tagline') }}</p>
        <div class="social-links">
          <a href="#" :aria-label="t('footer.social.instagram')"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
          <a href="#" :aria-label="t('footer.social.pinterest')"><font-awesome-icon :icon="['fab', 'pinterest']" /></a>
          <a href="#" :aria-label="t('footer.social.twitter')"><font-awesome-icon :icon="['fab', 'twitter']" /></a>
          <a href="#" :aria-label="t('footer.social.facebook')"><font-awesome-icon :icon="['fab', 'facebook-f']" /></a>
        </div>
      </div>
      <!-- Example static columns -->
      <div class="footer-column">
        <h3>{{ t('footer.about.title') }}</h3>
        <ul>
          <li><a href="#">{{ t('footer.about.ourStory') }}</a></li>
          <li><a href="#">{{ t('footer.about.sustainability') }}</a></li>
          <li><a href="#">{{ t('footer.about.designProcess') }}</a></li>
          <li><a href="#">{{ t('footer.about.careers') }}</a></li>
          <li><a href="#">{{ t('footer.about.press') }}</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h3>{{ t('footer.support.title') }}</h3>
        <ul>
          <li><a href="#">{{ t('footer.support.contactUs') }}</a></li>
          <li><a href="#">{{ t('footer.support.faqs') }}</a></li>
          <li><a href="#">{{ t('footer.support.shippingReturns') }}</a></li>
          <li><a href="#">{{ t('footer.support.warranty') }}</a></li>
          <li><a href="#">{{ t('footer.support.tradeProgram') }}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>{{ t('footer.bottom.contactLabel') }} <a href="mailto:hello@aurorafurnishings.example">hello@aurorafurnishings.example</a> | (555) 123-4567</p>
      <p>{{ t('footer.bottom.copyright', { currentYear: currentYear, appName: t('appName') }) }} | <a href="#">{{ t('footer.bottom.privacyPolicy') }}</a> | <a href="#">{{ t('footer.bottom.termsOfService') }}</a></p>
    </div>
  </footer>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n

  // --- Get translation function ---
  const { t } = useI18n();

  const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
</style>
