<template>
  <div class="language-switcher" ref="switcherRef">
    <button class="language-switcher__button"
            @click="toggleDropdown"
            :aria-label="t('languageSwitcher.changeLanguage')"
            aria-haspopup="true"
            :aria-expanded="isDropdownOpen"
            :title="t('languageSwitcher.currentLanguage', { lang: currentLanguageName })">
      <font-awesome-icon icon="language" />
      <span class="current-lang-code">{{ currentLanguageCode.toUpperCase() }}</span>
      <font-awesome-icon icon="caret-down" class="dropdown-arrow" />
    </button>
    <transition name="fade-fast">
      <!-- Use SUPPORTED_LOCALES imported from main.js -->
      <ul v-if="isDropdownOpen" class="language-switcher__dropdown" role="menu">
        <li v-for="lang in supportedLocales" :key="lang.code" role="presentation">
          <button @click="changeLanguage(lang.code)"
                  :class="{ active: lang.code === currentLanguageCode }"
                  role="menuitem"
                  :aria-current="lang.code === currentLanguageCode ? 'true' : null">
            {{ lang.name }} <!-- Use name from the config -->
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // Import the config from main.js
  import { SUPPORTED_LOCALES } from '@/main.js'; // Adjust path if necessary

  const { t, locale } = useI18n();
  const isDropdownOpen = ref(false);
  const switcherRef = ref(null);

  // Use the imported config
  const supportedLocales = ref(SUPPORTED_LOCALES);

  const currentLanguageCode = computed(() => locale.value);

  const currentLanguageName = computed(() => {
    const currentLang = supportedLocales.value.find(lang => lang.code === locale.value);
    return currentLang ? currentLang.name : locale.value.toUpperCase();
  });

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
  };

  const changeLanguage = (newLocale) => {
    if (supportedLocales.value.some(lang => lang.code === newLocale)) {
      locale.value = newLocale;
      localStorage.setItem('user-locale', newLocale);
      console.log(`Language changed to ${newLocale}`);
      isDropdownOpen.value = false;
      // Optional: Force reload or trigger data refetch if needed globally
      // Consider emitting an event instead of reload for better UX
      // emit('language-changed'); // Example event
    } else {
      console.warn(`Attempted to switch to unsupported locale: ${newLocale}`);
    }
  };

  // Click outside handler
  const handleClickOutside = (event) => {
    if (switcherRef.value && !switcherRef.value.contains(event.target)) {
      isDropdownOpen.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped>
  .language-switcher {
    position: relative;
    display: inline-flex; /* Align with other header items */
  }

  .language-switcher__button {
    background: none;
    border: 1px solid transparent; /* Transparent border for spacing */
    padding: 0.5rem 0.8rem;
    color: var(--text-dark);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4em;
    border-radius: var(--border-radius-small);
    transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  }

    .language-switcher__button:hover,
    .language-switcher__button:focus-visible {
      background-color: var(--bg-off-light);
      border-color: var(--border-color);
      color: var(--primary);
      outline: none;
    }

  .current-lang-code {
    margin: 0 0.1em 0 0.3em; /* Adjust spacing */
  }

  .dropdown-arrow {
    font-size: 0.8em;
    transition: transform 0.2s ease;
  }

  .language-switcher__button[aria-expanded='true'] .dropdown-arrow {
    transform: rotate(180deg);
  }

  .language-switcher__dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: var(--popup-z-index); /* Reuse dropdown z-index */
    background-color: var(--white);
    border-radius: var(--border-radius-small);
    box-shadow: var(--shadow-medium);
    min-width: 120px;
    list-style: none;
    padding: 0.5rem 0;
    margin: 0;
    border: 1px solid var(--border-color);
    max-height: 250px; /* Limit height */
    overflow-y: auto; /* Add scroll if needed */
  }

    .language-switcher__dropdown li {
      margin: 0;
    }

    .language-switcher__dropdown button {
      display: block;
      width: 100%;
      padding: 0.7rem 1rem;
      text-align: left;
      background: none;
      border: none;
      font-size: 0.9rem;
      color: var(--text-dark);
      cursor: pointer;
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }

      .language-switcher__dropdown button:hover,
      .language-switcher__dropdown button:focus-visible {
        background-color: var(--bg-off-light);
        color: var(--primary);
        outline: none;
      }

      .language-switcher__dropdown button.active {
        font-weight: 700;
        color: var(--primary);
        background-color: var(--bg-off-light);
        cursor: default;
      }

  /* Transition */
  .fade-fast-enter-active,
  .fade-fast-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .fade-fast-enter-from,
  .fade-fast-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }

  /* Responsive adjustments if needed */
  @media (max-width: 768px) {
    .language-switcher__button {
      padding: 0.4rem 0.6rem;
      font-size: 0.85rem;
    }

    /* Optionally hide code on mobile if too crowded */
    /* .language-switcher__button .current-lang-code { display: none; } */
  }
</style>
